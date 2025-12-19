/**
 * Store Zustand pour l'authentification
 */

import { create } from "zustand";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { User } from "../types";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AuthState {
  firebaseUser: FirebaseAuthTypes.User | null;
  userData: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  setFirebaseUser: (user: FirebaseAuthTypes.User | null) => void;
  setUserData: (data: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  userData: null,
  isLoading: true,
  isInitialized: false,
  
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setUserData: (data) => set({ userData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  clearAuth: () =>
    set({
      firebaseUser: null,
      userData: null,
      isLoading: false,
    }),
}));

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