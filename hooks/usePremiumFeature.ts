/**
 * Hook usePremiumFeature
 *
 * Simplifie la vérification des features premium dans les composants :
 * - checkFeature(feature) retourne { allowed, showPaywall }
 * - Gère automatiquement l'affichage du paywall
 * - Cache le résultat pour éviter les requêtes répétées
 *
 * PROMPT 7.2 : Hook usePremiumFeature
 */

import { useState, useCallback, useMemo } from "react";
import { useAuthStore } from "../stores/authStore";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import {
  subscriptionService,
  PremiumFeature,
} from "../services/subscription.service";

// ============================================================
// TYPES
// ============================================================

/** Résultat de vérification d'une feature */
export interface FeatureCheckResult {
  /** L'accès est-il autorisé ? */
  allowed: boolean;
  /** Faut-il afficher le paywall ? */
  showPaywall: boolean;
  /** Raison du blocage (si bloqué) */
  reason?: string;
  /** Chargement en cours */
  loading: boolean;
}

/** Options du hook */
export interface UsePremiumFeatureOptions {
  /** Code de session (pour les features nécessitant 2 premium) */
  sessionCode?: string;
  /** Callback appelé quand le paywall est affiché */
  onPaywallShow?: (feature: PremiumFeature) => void;
  /** Callback appelé quand l'utilisateur ferme le paywall */
  onPaywallClose?: () => void;
}

/** Retour du hook */
export interface UsePremiumFeatureReturn {
  /** Vérifie l'accès à une feature */
  checkFeature: (feature: PremiumFeature) => Promise<FeatureCheckResult>;
  /** Vérifie l'accès de manière synchrone (utilise le cache) */
  checkFeatureSync: (feature: PremiumFeature) => FeatureCheckResult;
  /** Affiche le paywall si la feature n'est pas accessible */
  requireFeature: (feature: PremiumFeature) => Promise<boolean>;
  /** Statut premium de l'utilisateur */
  isPremium: boolean;
  /** Chargement en cours */
  isChecking: boolean;
  /** Feature actuellement bloquée (pour le paywall) */
  blockedFeature: PremiumFeature | null;
  /** Ferme le paywall */
  closePaywall: () => void;
  /** État du paywall */
  paywallVisible: boolean;
}

// ============================================================
// HOOK
// ============================================================

export function usePremiumFeature(
  options: UsePremiumFeatureOptions = {}
): UsePremiumFeatureReturn {
  const { sessionCode, onPaywallShow, onPaywallClose } = options;

  // Stores
  const { firebaseUser, userData } = useAuthStore();
  const { isPremium, accessibleFeatures, checkFeatureAccess } =
    useSubscriptionStore();

  // ID utilisateur (préférer firebaseUser.uid car c'est l'ID auth)
  const userId = firebaseUser?.uid || userData?.id;

  // State local
  const [isChecking, setIsChecking] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<PremiumFeature | null>(
    null
  );
  const [paywallVisible, setPaywallVisible] = useState(false);

  // ----------------------------------------------------------
  // CHECK FEATURE (ASYNC)
  // ----------------------------------------------------------

  /**
   * Vérifie l'accès à une feature de manière asynchrone
   * Fait une requête au service si nécessaire
   */
  const checkFeature = useCallback(
    async (feature: PremiumFeature): Promise<FeatureCheckResult> => {
      // Si pas d'utilisateur, bloquer
      if (!userId) {
        return {
          allowed: false,
          showPaywall: true,
          reason: "Vous devez être connecté",
          loading: false,
        };
      }

      setIsChecking(true);

      try {
        // Utiliser le store pour la vérification
        const allowed = await checkFeatureAccess(userId, feature, sessionCode);

        const result: FeatureCheckResult = {
          allowed,
          showPaywall: !allowed,
          loading: false,
        };

        if (!allowed) {
          const config = subscriptionService.getFeatureConfig(feature);
          result.reason = config?.description || "Fonctionnalité Premium";
        }

        return result;
      } catch (error) {
        console.error("[usePremiumFeature] checkFeature error:", error);
        return {
          allowed: false,
          showPaywall: true,
          reason: "Erreur de vérification",
          loading: false,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [userId, sessionCode, checkFeatureAccess]
  );

  // ----------------------------------------------------------
  // CHECK FEATURE SYNC
  // ----------------------------------------------------------

  /**
   * Vérifie l'accès à une feature de manière synchrone
   * Utilise le cache du store (plus rapide mais peut être obsolète)
   */
  const checkFeatureSync = useCallback(
    (feature: PremiumFeature): FeatureCheckResult => {
      // Si pas d'utilisateur, bloquer
      if (!userId) {
        return {
          allowed: false,
          showPaywall: true,
          reason: "Vous devez être connecté",
          loading: false,
        };
      }

      // Récupérer la config de la feature
      const config = subscriptionService.getFeatureConfig(feature);

      // Si la feature ne nécessite pas premium, autoriser
      if (!config?.requiresPremium) {
        return {
          allowed: true,
          showPaywall: false,
          loading: false,
        };
      }

      // Si l'utilisateur est premium
      if (isPremium) {
        // Vérifier si dans les features accessibles
        const inCache = accessibleFeatures.includes(feature);

        // Pour les features nécessitant 2 premium, on ne peut pas vérifier sync
        if (config.requiresBothPremium) {
          return {
            allowed: false,
            showPaywall: true,
            reason: "Vérification requise",
            loading: true, // Indique qu'il faut une vérification async
          };
        }

        return {
          allowed: inCache,
          showPaywall: !inCache,
          reason: inCache ? undefined : config.description,
          loading: false,
        };
      }

      // Utilisateur non premium
      return {
        allowed: false,
        showPaywall: true,
        reason: config.description,
        loading: false,
      };
    },
    [userId, isPremium, accessibleFeatures]
  );

  // ----------------------------------------------------------
  // REQUIRE FEATURE
  // ----------------------------------------------------------

  /**
   * Vérifie l'accès et affiche le paywall si nécessaire
   * Retourne true si l'accès est autorisé, false sinon
   */
  const requireFeature = useCallback(
    async (feature: PremiumFeature): Promise<boolean> => {
      const result = await checkFeature(feature);

      if (!result.allowed && result.showPaywall) {
        setBlockedFeature(feature);
        setPaywallVisible(true);
        onPaywallShow?.(feature);
        return false;
      }

      return result.allowed;
    },
    [checkFeature, onPaywallShow]
  );

  // ----------------------------------------------------------
  // PAYWALL HANDLERS
  // ----------------------------------------------------------

  /**
   * Ferme le paywall
   */
  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    setBlockedFeature(null);
    onPaywallClose?.();
  }, [onPaywallClose]);

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    checkFeature,
    checkFeatureSync,
    requireFeature,
    isPremium,
    isChecking,
    blockedFeature,
    closePaywall,
    paywallVisible,
  };
}

// ============================================================
// HOOK SIMPLIFIÉ POUR UNE FEATURE SPÉCIFIQUE
// ============================================================

/**
 * Hook simplifié pour vérifier une feature spécifique
 *
 * Usage:
 * const { allowed, showPaywall } = useFeatureAccess('level4');
 */
export function useFeatureAccess(
  feature: PremiumFeature,
  sessionCode?: string
): {
  allowed: boolean;
  showPaywall: boolean;
  reason?: string;
  check: () => Promise<boolean>;
} {
  const { firebaseUser, userData } = useAuthStore();
  const { isPremium, accessibleFeatures, checkFeatureAccess } =
    useSubscriptionStore();

  // ID utilisateur
  const userId = firebaseUser?.uid || userData?.id;

  // Vérification synchrone rapide
  const syncResult = useMemo(() => {
    if (!userId) {
      return { allowed: false, showPaywall: true, reason: "Non connecté" };
    }

    const config = subscriptionService.getFeatureConfig(feature);

    if (!config?.requiresPremium) {
      return { allowed: true, showPaywall: false };
    }

    if (isPremium && accessibleFeatures.includes(feature)) {
      return { allowed: true, showPaywall: false };
    }

    return {
      allowed: false,
      showPaywall: true,
      reason: config?.description,
    };
  }, [userId, isPremium, accessibleFeatures, feature]);

  // Vérification async
  const check = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    return checkFeatureAccess(userId, feature, sessionCode);
  }, [userId, feature, sessionCode, checkFeatureAccess]);

  return {
    ...syncResult,
    check,
  };
}

// ============================================================
// HOOK POUR MULTIPLE FEATURES
// ============================================================

/**
 * Hook pour vérifier plusieurs features en une fois
 *
 * Usage:
 * const features = useMultipleFeatures(['level4', 'premiumThemes']);
 * if (features.level4.allowed) { ... }
 */
export function useMultipleFeatures(
  features: PremiumFeature[]
): Record<PremiumFeature, { allowed: boolean; showPaywall: boolean }> {
  const { firebaseUser, userData } = useAuthStore();
  const { isPremium, accessibleFeatures } = useSubscriptionStore();

  // ID utilisateur
  const userId = firebaseUser?.uid || userData?.id;

  return useMemo(() => {
    const result: Record<
      PremiumFeature,
      { allowed: boolean; showPaywall: boolean }
    > = {} as any;

    for (const feature of features) {
      if (!userId) {
        result[feature] = { allowed: false, showPaywall: true };
        continue;
      }

      const config = subscriptionService.getFeatureConfig(feature);

      if (!config?.requiresPremium) {
        result[feature] = { allowed: true, showPaywall: false };
        continue;
      }

      if (isPremium && accessibleFeatures.includes(feature)) {
        result[feature] = { allowed: true, showPaywall: false };
      } else {
        result[feature] = { allowed: false, showPaywall: true };
      }
    }

    return result;
  }, [userId, isPremium, accessibleFeatures, features]);
}

// ============================================================
// EXPORTS
// ============================================================

export default usePremiumFeature;