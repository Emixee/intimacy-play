/**
 * Store Zustand pour l'authentification
 * 
 * Version corrigée avec :
 * - Initialisation singleton du listener Firebase
 * - Fonctions stables (pas de re-création)
 * - Gestion propre des subscriptions
 */

import { create } from "zustand";
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
}

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useAuthStore = create<AuthState>()((set) => ({
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
}));

// ============================================================
// SINGLETON INITIALIZATION (appelé une seule fois)
// ============================================================

interface ListenerState {
  isInitialized: boolean;
  authUnsubscribe: (() => void) | null;
  userDataUnsubscribe: (() => void) | null;
}

const listenerState: ListenerState = {
  isInitialized: false,
  authUnsubscribe: null,
  userDataUnsubscribe: null,
};

/**
 * Initialise les listeners Firebase Auth
 * À appeler UNE SEULE FOIS dans app/_layout.tsx
 */
export const initializeAuthListeners = (): (() => void) => {
  // Éviter les initialisations multiples
  if (listenerState.isInitialized) {
    console.log("[AuthStore] Already initialized, skipping");
    return () => {};
  }
  
  listenerState.isInitialized = true;
  console.log("[AuthStore] Initializing auth listener");
  
  const { setFirebaseUser, setUserData, setLoading, setInitialized } = useAuthStore.getState();
  
  // Listener principal d'authentification
  listenerState.authUnsubscribe = auth().onAuthStateChanged(async (user) => {
    console.log("[AuthStore] Auth state changed:", user?.uid ?? "null");
    
    // Cleanup previous user data listener
    if (listenerState.userDataUnsubscribe) {
      listenerState.userDataUnsubscribe();
      listenerState.userDataUnsubscribe = null;
    }
    
    if (user) {
      // Utilisateur connecté
      useAuthStore.setState({ firebaseUser: user });
      
      // Écouter les changements des données utilisateur
      listenerState.userDataUnsubscribe = firestore()
        .collection("users")
        .doc(user.uid)
        .onSnapshot(
          (snapshot) => {
            if (snapshot.exists()) {
              const data = { id: snapshot.id, ...snapshot.data() } as User;
              console.log("[AuthStore] User data updated:", data.displayName ?? "no name");
              useAuthStore.setState({ 
                userData: data, 
                isLoading: false, 
                isInitialized: true 
              });
            } else {
              console.log("[AuthStore] User document not found");
              useAuthStore.setState({ 
                userData: null, 
                isLoading: false, 
                isInitialized: true 
              });
            }
          },
          (error) => {
            console.error("[AuthStore] User data listener error:", error);
            useAuthStore.setState({ 
              userData: null, 
              isLoading: false, 
              isInitialized: true 
            });
          }
        );
    } else {
      // Utilisateur déconnecté
      console.log("[AuthStore] User logged out");
      useAuthStore.setState({
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
    
    if (listenerState.authUnsubscribe) {
      listenerState.authUnsubscribe();
      listenerState.authUnsubscribe = null;
    }
    
    if (listenerState.userDataUnsubscribe) {
      listenerState.userDataUnsubscribe();
      listenerState.userDataUnsubscribe = null;
    }
    
    listenerState.isInitialized = false;
  };
};

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