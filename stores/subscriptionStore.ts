/**
 * Store Zustand pour la gestion des abonnements Premium
 *
 * Gère l'état de l'abonnement côté client :
 * - Statut premium en temps réel
 * - Cache des vérifications de features
 * - Actions d'achat et de vérification
 *
 * PROMPT 7.1 : Store Subscription
 */

import { create } from "zustand";
import {
  subscriptionService,
  SubscriptionStatus,
  PremiumFeature,
  PurchaseReceipt,
  VerifyPurchaseResult,
} from "../services/subscription.service";
import { PremiumPlan, ApiResponse } from "../types";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface SubscriptionState {
  // État de l'abonnement
  isPremium: boolean;
  premiumUntil: Date | null;
  plan: PremiumPlan | null;
  daysRemaining: number | null;
  isExpired: boolean;

  // États de chargement
  loading: boolean;
  verifying: boolean;

  // Erreurs
  error: string | null;

  // Cache des features accessibles
  accessibleFeatures: PremiumFeature[];

  // Actions
  loadSubscriptionStatus: (userId: string) => Promise<void>;
  verifyAndActivatePurchase: (
    userId: string,
    receipt: PurchaseReceipt,
    productId: string
  ) => Promise<ApiResponse<VerifyPurchaseResult>>;
  checkFeatureAccess: (
    userId: string,
    feature: PremiumFeature,
    sessionCode?: string
  ) => Promise<boolean>;
  refreshFeatures: (userId: string) => Promise<void>;
  resetSubscription: () => void;
  clearError: () => void;
}

// ============================================================
// ÉTAT INITIAL
// ============================================================

const INITIAL_STATE = {
  isPremium: false,
  premiumUntil: null,
  plan: null,
  daysRemaining: null,
  isExpired: false,
  loading: false,
  verifying: false,
  error: null,
  accessibleFeatures: [] as PremiumFeature[],
};

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...INITIAL_STATE,

  // ----------------------------------------------------------
  // CHARGEMENT DU STATUT D'ABONNEMENT
  // ----------------------------------------------------------

  loadSubscriptionStatus: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await subscriptionService.getSubscriptionStatus(userId);

      if (!result.success || !result.data) {
        set({
          loading: false,
          error: result.error || "Erreur lors du chargement",
        });
        return;
      }

      const status = result.data;

      set({
        isPremium: status.isPremium,
        premiumUntil: status.expiresAt,
        plan: status.plan,
        daysRemaining: status.daysRemaining,
        isExpired: status.isExpired,
        loading: false,
      });

      // Charger les features accessibles
      await get().refreshFeatures(userId);
    } catch (error: any) {
      console.error("[SubscriptionStore] loadSubscriptionStatus error:", error);
      set({
        loading: false,
        error: "Erreur lors du chargement du statut",
      });
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION ET ACTIVATION D'UN ACHAT
  // ----------------------------------------------------------

  verifyAndActivatePurchase: async (
    userId: string,
    receipt: PurchaseReceipt,
    productId: string
  ) => {
    set({ verifying: true, error: null });

    try {
      const result = await subscriptionService.verifyPurchase(
        userId,
        receipt,
        productId
      );

      if (!result.success) {
        set({
          verifying: false,
          error: result.error || "Erreur de vérification",
        });
        return result;
      }

      const verifyResult = result.data;

      if (verifyResult?.isValid) {
        // Mettre à jour le store avec le nouveau statut
        set({
          isPremium: true,
          premiumUntil: verifyResult.expirationDate,
          plan: verifyResult.plan,
          daysRemaining: verifyResult.expirationDate
            ? Math.ceil(
                (verifyResult.expirationDate.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
          isExpired: false,
          verifying: false,
        });

        // Rafraîchir les features accessibles
        await get().refreshFeatures(userId);
      } else {
        set({
          verifying: false,
          error: verifyResult?.error || "Achat non valide",
        });
      }

      return result;
    } catch (error: any) {
      console.error("[SubscriptionStore] verifyAndActivatePurchase error:", error);
      set({
        verifying: false,
        error: "Erreur lors de la vérification de l'achat",
      });
      return {
        success: false,
        error: "Erreur lors de la vérification de l'achat",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION D'ACCÈS À UNE FEATURE
  // ----------------------------------------------------------

  checkFeatureAccess: async (
    userId: string,
    feature: PremiumFeature,
    sessionCode?: string
  ) => {
    // Vérification rapide en cache pour les features ne nécessitant pas les 2 premium
    const { accessibleFeatures, isPremium } = get();

    // Si pas premium et feature premium requise, accès refusé
    if (!isPremium) {
      const featureConfig = subscriptionService.getFeatureConfig(feature);
      if (featureConfig?.requiresPremium) {
        return false;
      }
    }

    // Si en cache et pas de vérification des 2 partenaires requise
    const featureConfig = subscriptionService.getFeatureConfig(feature);
    if (
      accessibleFeatures.includes(feature) &&
      !featureConfig?.requiresBothPremium
    ) {
      return true;
    }

    // Sinon, vérification complète via le service
    try {
      const result = await subscriptionService.canAccessFeature(
        userId,
        feature,
        sessionCode
      );

      return result.success && result.data?.canAccess === true;
    } catch (error) {
      console.error("[SubscriptionStore] checkFeatureAccess error:", error);
      return false;
    }
  },

  // ----------------------------------------------------------
  // RAFRAÎCHISSEMENT DES FEATURES ACCESSIBLES
  // ----------------------------------------------------------

  refreshFeatures: async (userId: string) => {
    try {
      const result = await subscriptionService.getAccessibleFeatures(userId);

      if (result.success && result.data) {
        set({ accessibleFeatures: result.data });
      }
    } catch (error) {
      console.error("[SubscriptionStore] refreshFeatures error:", error);
    }
  },

  // ----------------------------------------------------------
  // RESET DU STORE
  // ----------------------------------------------------------

  resetSubscription: () => {
    set(INITIAL_STATE);
  },

  // ----------------------------------------------------------
  // CLEAR ERROR
  // ----------------------------------------------------------

  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================
// SELECTORS
// ============================================================

/** Sélecteur pour le statut premium */
export const selectIsPremium = (state: SubscriptionState) => state.isPremium;

/** Sélecteur pour le plan d'abonnement */
export const selectPlan = (state: SubscriptionState) => state.plan;

/** Sélecteur pour la date d'expiration */
export const selectPremiumUntil = (state: SubscriptionState) => state.premiumUntil;

/** Sélecteur pour les jours restants */
export const selectDaysRemaining = (state: SubscriptionState) => state.daysRemaining;

/** Sélecteur pour le chargement */
export const selectLoading = (state: SubscriptionState) => state.loading;

/** Sélecteur pour la vérification */
export const selectVerifying = (state: SubscriptionState) => state.verifying;

/** Sélecteur pour l'erreur */
export const selectError = (state: SubscriptionState) => state.error;

/** Sélecteur pour les features accessibles */
export const selectAccessibleFeatures = (state: SubscriptionState) =>
  state.accessibleFeatures;

/** Sélecteur composé pour l'état complet */
export const selectSubscriptionStatus = (
  state: SubscriptionState
): SubscriptionStatus => ({
  isPremium: state.isPremium,
  plan: state.plan,
  expiresAt: state.premiumUntil,
  isExpired: state.isExpired,
  daysRemaining: state.daysRemaining,
});

// ============================================================
// HOOKS UTILITAIRES
// ============================================================

/**
 * Hook pour vérifier rapidement si une feature est accessible
 * Utilise le cache du store
 *
 * @param feature - Feature à vérifier
 * @returns boolean
 */
export const useCanAccessFeature = (feature: PremiumFeature): boolean => {
  return useSubscriptionStore((state) => {
    if (!state.isPremium) {
      const config = subscriptionService.getFeatureConfig(feature);
      return !config?.requiresPremium;
    }
    return state.accessibleFeatures.includes(feature);
  });
};

/**
 * Hook pour obtenir le statut premium formaté
 *
 * @returns Objet avec les infos formatées
 */
export const usePremiumStatus = () => {
  return useSubscriptionStore((state) => ({
    isPremium: state.isPremium,
    planLabel: state.plan === "monthly" ? "Mensuel" : state.plan === "yearly" ? "Annuel" : null,
    expiresFormatted: state.premiumUntil
      ? state.premiumUntil.toLocaleDateString("fr-FR")
      : null,
    daysRemaining: state.daysRemaining,
    isAboutToExpire: state.daysRemaining !== null && state.daysRemaining <= 7,
  }));
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useSubscriptionStore;