/**
 * Store Zustand pour l'authentification
 * 
 * Version corrigée avec :
 * - Initialisation singleton du listener Firebase
 * - Fonctions stables (pas de re-création)
 * - Gestion propre des subscriptions
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { User } from "../types";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AuthState {
  // State
  firebaseUser: FirebaseAuthTypes.User | null;
  userData: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setFirebaseUser: (user: FirebaseAuthTypes.User | null) => void;
  setUserData: (data: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
  
  // Initialization
  initializeAuth: () => () => void;
}

// ============================================================
// VARIABLES GLOBALES (SINGLETON)
// ============================================================

let isAuthInitialized = false;
let authUnsubscribe: (() => void) | null = null;
let userDataUnsubscribe: (() => void) | null = null;

// Helper pour cleanup les listeners de manière sécurisée
const cleanupUserDataListener = () => {
  if (userDataUnsubscribe !== null) {
    userDataUnsubscribe();
    userDataUnsubscribe = null;
  }
};

const cleanupAllListeners = () => {
  if (authUnsubscribe !== null) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
  cleanupUserDataListener();
  isAuthInitialized = false;
};

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    firebaseUser: null,
    userData: null,
    isLoading: true,
    isInitialized: false,
    
    // Actions
    setFirebaseUser: (user) => set({ firebaseUser: user }),
    setUserData: (data) => set({ userData: data }),
    setLoading: (loading) => set({ isLoading: loading }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    clearAuth: () => set({
      firebaseUser: null,
      userData: null,
      isLoading: false,
    }),
    
    // Initialize auth listener (singleton)
    initializeAuth: () => {
      // Éviter les initialisations multiples
      if (isAuthInitialized) {
        console.log("[AuthStore] Already initialized, skipping");
        return () => {};
      }
      
      isAuthInitialized = true;
      console.log("[AuthStore] Initializing auth listener");
      
      // Listener principal d'authentification
      authUnsubscribe = auth().onAuthStateChanged(async (user) => {
        console.log("[AuthStore] Auth state changed:", user?.uid ?? "null");
        
        // Cleanup previous user data listener
        cleanupUserDataListener();
        
        if (user) {
          // Utilisateur connecté
          set({ firebaseUser: user });
          
          // Écouter les changements des données utilisateur
          userDataUnsubscribe = firestore()
            .collection("users")
            .doc(user.uid)
            .onSnapshot(
              (snapshot) => {
                if (snapshot.exists) {
                  const data = { id: snapshot.id, ...snapshot.data() } as User;
                  console.log("[AuthStore] User data updated:", data.displayName ?? "no name");
                  set({ 
                    userData: data, 
                    isLoading: false, 
                    isInitialized: true 
                  });
                } else {
                  console.log("[AuthStore] User document not found");
                  set({ 
                    userData: null, 
                    isLoading: false, 
                    isInitialized: true 
                  });
                }
              },
              (error) => {
                console.error("[AuthStore] User data listener error:", error);
                set({ 
                  userData: null, 
                  isLoading: false, 
                  isInitialized: true 
                });
              }
            );
        } else {
          // Utilisateur déconnecté
          console.log("[AuthStore] User logged out");
          set({
            firebaseUser: null,
            userData: null,
            isLoading: false,
            isInitialized: true,
          });
        }
      });
      
      // Retourne la fonction de cleanup
      return () => {
        console.log("[AuthStore] Cleaning up auth listeners");
        cleanupAllListeners();
      };
    },
  }))
);

// ============================================================
// SELECTORS (pour éviter les re-renders inutiles)
// ============================================================

export const selectFirebaseUser = (state: AuthState) => state.firebaseUser;
export const selectUserData = (state: AuthState) => state.userData;
export const selectIsAuthenticated = (state: AuthState) => state.firebaseUser !== null;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectIsPremium = (state: AuthState) => {
  const userData = state.userData;
  if (!userData?.premium) return false;
  if (!userData.premiumUntil) return false;
  return userData.premiumUntil.toDate() > new Date();
};