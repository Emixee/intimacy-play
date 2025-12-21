/**
 * Store Zustand pour les données utilisateur et préférences
 *
 * Complémentaire à authStore.ts :
 * - authStore gère l'état d'authentification Firebase
 * - userStore gère les opérations sur le profil et préférences
 */

import { create } from "zustand";
import {
  User,
  Theme,
  Toy,
  ApiResponse,
} from "../types";
import { userService } from "../services/user.service";
import { preferencesService, MediaPreferences } from "../services/preferences.service";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface UserStoreState {
  // État
  isUpdating: boolean;
  updateError: string | null;

  // Actions profil
  updateProfile: (
    uid: string,
    data: {
      displayName?: string;
      notificationsEnabled?: boolean;
    }
  ) => Promise<ApiResponse>;

  // Actions préférences
  updateThemes: (
    uid: string,
    themes: Theme[],
    isPremium: boolean
  ) => Promise<ApiResponse<Theme[]>>;

  updateToys: (
    uid: string,
    toys: Toy[],
    isPremium: boolean
  ) => Promise<ApiResponse<Toy[]>>;

  updateMediaPreferences: (
    uid: string,
    prefs: MediaPreferences,
    isPremium: boolean
  ) => Promise<ApiResponse>;

  updatePartnerNickname: (
    uid: string,
    nickname: string,
    isPremium: boolean
  ) => Promise<ApiResponse>;

  // Helpers
  clearError: () => void;
}

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useUserStore = create<UserStoreState>((set, get) => ({
  // État initial
  isUpdating: false,
  updateError: null,

  // ----------------------------------------------------------
  // MISE À JOUR DU PROFIL
  // ----------------------------------------------------------

  updateProfile: async (uid, data) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await userService.updateUserDocument(uid, data);

      if (!response.success) {
        set({ updateError: response.error || "Erreur inconnue" });
      }

      return response;
    } catch (error: any) {
      const errorMessage = "Erreur lors de la mise à jour du profil";
      set({ updateError: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isUpdating: false });
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DES THÈMES
  // ----------------------------------------------------------

  updateThemes: async (uid, themes, isPremium) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await preferencesService.updateThemes(
        uid,
        themes,
        isPremium
      );

      if (!response.success) {
        set({ updateError: response.error || "Erreur inconnue" });
      }

      return response;
    } catch (error: any) {
      const errorMessage = "Erreur lors de la mise à jour des thèmes";
      set({ updateError: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isUpdating: false });
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DES JOUETS
  // ----------------------------------------------------------

  updateToys: async (uid, toys, isPremium) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await preferencesService.updateToys(uid, toys, isPremium);

      if (!response.success) {
        set({ updateError: response.error || "Erreur inconnue" });
      }

      return response;
    } catch (error: any) {
      const errorMessage = "Erreur lors de la mise à jour des jouets";
      set({ updateError: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isUpdating: false });
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DES PRÉFÉRENCES MÉDIA
  // ----------------------------------------------------------

  updateMediaPreferences: async (uid, prefs, isPremium) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await preferencesService.updateMediaPreferences(
        uid,
        prefs,
        isPremium
      );

      if (!response.success) {
        set({ updateError: response.error || "Erreur inconnue" });
      }

      return response;
    } catch (error: any) {
      const errorMessage = "Erreur lors de la mise à jour des préférences média";
      set({ updateError: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isUpdating: false });
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DU SURNOM DU PARTENAIRE
  // ----------------------------------------------------------

  updatePartnerNickname: async (uid, nickname, isPremium) => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await preferencesService.updatePartnerNickname(
        uid,
        nickname,
        isPremium
      );

      if (!response.success) {
        set({ updateError: response.error || "Erreur inconnue" });
      }

      return response;
    } catch (error: any) {
      const errorMessage = "Erreur lors de la mise à jour du surnom";
      set({ updateError: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isUpdating: false });
    }
  },

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  clearError: () => {
    set({ updateError: null });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectIsUpdating = (state: UserStoreState) => state.isUpdating;
export const selectUpdateError = (state: UserStoreState) => state.updateError;

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useUserStore;