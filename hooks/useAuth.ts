/**
 * Hook d'authentification
 *
 * Version simplifiée qui utilise le store Zustand
 * L'initialisation est gérée par le store (singleton pattern)
 *
 * Usage:
 * const { user, userData, isAuthenticated, isLoading, login, register, logout } = useAuth();
 */

import { useEffect, useCallback, useMemo } from "react";
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
  // Sélectionner les valeurs individuellement pour éviter les re-renders
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const userData = useAuthStore((state) => state.userData);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setUserData = useAuthStore((state) => state.setUserData);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // ----------------------------------------------------------
  // INITIALISATION (une seule fois globalement)
  // ----------------------------------------------------------

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  // ----------------------------------------------------------
  // COMPUTED VALUES (mémorisées)
  // ----------------------------------------------------------

  const isAuthenticated = firebaseUser !== null;

  const isEmailVerified = firebaseUser?.emailVerified ?? false;

  const isPremium = useMemo((): boolean => {
    if (!userData?.premium) return false;
    if (!userData.premiumUntil) return false;
    return userData.premiumUntil.toDate() > new Date();
  }, [userData?.premium, userData?.premiumUntil]);

  // ----------------------------------------------------------
  // ACTIONS (stables avec useCallback)
  // ----------------------------------------------------------

  /**
   * Connexion utilisateur
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
      setLoading(true);
      try {
        const result = await authService.login(credentials);
        // Le listener onAuthStateChanged dans le store gère le reste
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
        // Le listener onAuthStateChanged dans le store gère le reste
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
      // Le listener onAuthStateChanged dans le store gère le reste
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