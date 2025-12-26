/**
 * Store Zustand pour l'authentification
 * 
 * Version corrigée avec :
 * - Timeout pour éviter le blocage infini
 * - Meilleure gestion des erreurs Firestore
 * - isLoading réinitialisé correctement
 */

import { create } from "zustand";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { User } from "../types";

// ============================================================
// CONSTANTES
// ============================================================

/** Timeout pour le chargement des données utilisateur (ms) */
const USER_DATA_TIMEOUT = 10000; // 10 secondes

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
// SINGLETON INITIALIZATION
// ============================================================

interface ListenerState {
  isInitialized: boolean;
  authUnsubscribe: (() => void) | null;
  userDataUnsubscribe: (() => void) | null;
  timeoutId: NodeJS.Timeout | null;
}

const listenerState: ListenerState = {
  isInitialized: false,
  authUnsubscribe: null,
  userDataUnsubscribe: null,
  timeoutId: null,
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
  
  // Listener principal d'authentification
  listenerState.authUnsubscribe = auth().onAuthStateChanged(async (user) => {
    console.log("[AuthStore] Auth state changed:", user?.uid ?? "null");
    
    // Cleanup previous listeners & timeout
    if (listenerState.userDataUnsubscribe) {
      listenerState.userDataUnsubscribe();
      listenerState.userDataUnsubscribe = null;
    }
    if (listenerState.timeoutId) {
      clearTimeout(listenerState.timeoutId);
      listenerState.timeoutId = null;
    }
    
    if (user) {
      // =====================================================
      // UTILISATEUR CONNECTÉ
      // =====================================================
      console.log("[AuthStore] User logged in, loading user data...");
      
      // Mettre à jour firebaseUser immédiatement
      useAuthStore.setState({ firebaseUser: user });
      
      // TIMEOUT: Ne pas rester bloqué indéfiniment
      listenerState.timeoutId = setTimeout(() => {
        console.warn("[AuthStore] Timeout loading user data!");
        useAuthStore.setState({ 
          isLoading: false, 
          isInitialized: true 
        });
      }, USER_DATA_TIMEOUT);
      
      // Écouter les changements des données utilisateur
      listenerState.userDataUnsubscribe = firestore()
        .collection("users")
        .doc(user.uid)
        .onSnapshot(
          (snapshot) => {
            // Clear timeout car on a reçu une réponse
            if (listenerState.timeoutId) {
              clearTimeout(listenerState.timeoutId);
              listenerState.timeoutId = null;
            }
            
            if (snapshot.exists) {
              const data = { id: snapshot.id, ...snapshot.data() } as User;
              console.log("[AuthStore] User data loaded:", data.displayName ?? "no name");
              useAuthStore.setState({ 
                userData: data, 
                isLoading: false, 
                isInitialized: true 
              });
            } else {
              // Document n'existe pas - peut arriver si le compte a été créé
              // mais le document Firestore n'a pas encore été créé
              console.warn("[AuthStore] User document not found for:", user.uid);
              useAuthStore.setState({ 
                userData: null, 
                isLoading: false, 
                isInitialized: true 
              });
            }
          },
          (error) => {
            // Clear timeout
            if (listenerState.timeoutId) {
              clearTimeout(listenerState.timeoutId);
              listenerState.timeoutId = null;
            }
            
            console.error("[AuthStore] User data listener error:", error);
            console.error("[AuthStore] Error code:", error.code);
            
            // Continuer même en cas d'erreur pour ne pas bloquer l'app
            useAuthStore.setState({ 
              userData: null, 
              isLoading: false, 
              isInitialized: true 
            });
          }
        );
    } else {
      // =====================================================
      // UTILISATEUR DÉCONNECTÉ
      // =====================================================
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
    
    if (listenerState.timeoutId) {
      clearTimeout(listenerState.timeoutId);
      listenerState.timeoutId = null;
    }
    
    listenerState.isInitialized = false;
  };
};

// ============================================================
// SELECTORS
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
