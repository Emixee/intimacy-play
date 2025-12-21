/**
 * Hook d'authentification
 *
 * Gère automatiquement :
 * - L'écoute des changements d'état auth Firebase
 * - Le chargement des données utilisateur depuis Firestore
 * - Le state loading initial
 * - Les actions auth (login, register, logout, etc.)
 *
 * Usage:
 * const { user, userData, isAuthenticated, isLoading, login, register, logout } = useAuth();
 */

import { useEffect, useCallback, useRef } from "react";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/auth.service";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
} from "../types";

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseAuthReturn {
  // State
  firebaseUser: FirebaseAuthTypes.User | null;
  userData: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isPremium: boolean;
  isEmailVerified: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<ApiResponse<FirebaseAuthTypes.User>>;
  register: (credentials: RegisterCredentials) => Promise<ApiResponse<FirebaseAuthTypes.User>>;
  logout: () => Promise<ApiResponse>;
  resetPassword: (email: string) => Promise<ApiResponse>;
  resendVerificationEmail: () => Promise<ApiResponse>;
  refreshUserData: () => Promise<void>;
}

// ============================================================
// HOOK
// ============================================================

export const useAuth = (): UseAuthReturn => {
  // Store
  const {
    firebaseUser,
    userData,
    isLoading,
    isInitialized,
    setFirebaseUser,
    setUserData,
    setLoading,
    setInitialized,
    clearAuth,
  } = useAuthStore();

  // Ref pour le cleanup du listener userData
  const userDataUnsubscribeRef = useRef<(() => void) | null>(null);

  // ----------------------------------------------------------
  // LISTENER AUTH STATE
  // ----------------------------------------------------------

  useEffect(() => {
    console.log("[useAuth] Setting up auth state listener");

    const unsubscribeAuth = authService.onAuthStateChanged(
      async (user: FirebaseAuthTypes.User | null) => {
        console.log("[useAuth] Auth state changed:", user?.uid ?? "null");

        // Cleanup previous user data listener
        if (userDataUnsubscribeRef.current) {
          userDataUnsubscribeRef.current();
          userDataUnsubscribeRef.current = null;
        }

        if (user) {
          // Utilisateur connecté
          setFirebaseUser(user);

          // Écouter les changements des données utilisateur
          userDataUnsubscribeRef.current = authService.onUserDataChanged(
            user.uid,
            (data: User | null) => {
              console.log("[useAuth] User data changed:", data?.displayName ?? "null");
              setUserData(data);
              setLoading(false);
              setInitialized(true);
            }
          );
        } else {
          // Utilisateur déconnecté
          clearAuth();
          setInitialized(true);
        }
      }
    );

    // Cleanup au démontage
    return () => {
      console.log("[useAuth] Cleaning up listeners");
      unsubscribeAuth();
      if (userDataUnsubscribeRef.current) {
        userDataUnsubscribeRef.current();
        userDataUnsubscribeRef.current = null;
      }
    };
  }, [setFirebaseUser, setUserData, setLoading, setInitialized, clearAuth]);

  // ----------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------

  const isAuthenticated = firebaseUser !== null;

  const isEmailVerified = firebaseUser?.emailVerified ?? false;

  const isPremium = useCallback((): boolean => {
    if (!userData?.premium) return false;
    if (!userData.premiumUntil) return false;
    return userData.premiumUntil.toDate() > new Date();
  }, [userData])();

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  /**
   * Connexion utilisateur
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
      setLoading(true);
      try {
        const result = await authService.login(credentials);
        // Le listener onAuthStateChanged gère le reste
        return result;
      } catch (error: any) {
        setLoading(false);
        return {
          success: false,
          error: error.message || "Erreur de connexion",
        };
      }
    },
    [setLoading]
  );

  /**
   * Inscription utilisateur
   */
  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
      setLoading(true);
      try {
        const result = await authService.register(credentials);
        // Le listener onAuthStateChanged gère le reste
        return result;
      } catch (error: any) {
        setLoading(false);
        return {
          success: false,
          error: error.message || "Erreur d'inscription",
        };
      }
    },
    [setLoading]
  );

  /**
   * Déconnexion utilisateur
   */
  const logout = useCallback(async (): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const result = await authService.logout();
      // Le listener onAuthStateChanged gère le reste
      return result;
    } catch (error: any) {
      setLoading(false);
      return {
        success: false,
        error: error.message || "Erreur de déconnexion",
      };
    }
  }, [setLoading]);

  /**
   * Réinitialisation du mot de passe
   */
  const resetPassword = useCallback(
    async (email: string): Promise<ApiResponse> => {
      return authService.resetPassword(email);
    },
    []
  );

  /**
   * Renvoyer l'email de vérification
   */
  const resendVerificationEmail = useCallback(async (): Promise<ApiResponse> => {
    return authService.resendVerificationEmail();
  }, []);

  /**
   * Rafraîchir les données utilisateur manuellement
   */
  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!firebaseUser) return;

    const result = await authService.getUserData(firebaseUser.uid);
    if (result.success && result.data) {
      setUserData(result.data);
    }
  }, [firebaseUser, setUserData]);

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    // State
    firebaseUser,
    userData,
    isAuthenticated,
    isLoading,
    isInitialized,
    isPremium,
    isEmailVerified,

    // Actions
    login,
    register,
    logout,
    resetPassword,
    resendVerificationEmail,
    refreshUserData,
  };
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useAuth;