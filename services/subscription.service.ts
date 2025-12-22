/**
 * Service de gestion des abonnements Premium
 *
 * Gère toutes les opérations liées aux abonnements :
 * - Vérification du statut premium
 * - Validation des achats IAP (In-App Purchase)
 * - Activation/désactivation des abonnements
 * - Vérification des accès aux features premium
 *
 * PROMPT 7.1 : Service Subscription
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  serverTimestamp,
  toTimestamp,
  usersCollection,
  sessionsCollection,
} from "../config/firebase";
import {
  User,
  PremiumPlan,
  ApiResponse,
  Session,
} from "../types";
import { PRICING, LIMITS, REACTIONS_PREMIUM, THEMES_PREMIUM } from "../utils/constants";

// ============================================================
// TYPES SPÉCIFIQUES AU SERVICE
// ============================================================

/** Features Premium disponibles */
export type PremiumFeature =
  | "level4"              // Accès aux niveaux 3-4
  | "unlimitedChanges"    // Changements de défi illimités
  | "premiumReactions"    // Réactions 🥵💦👅🍑😈💋
  | "mediaPreferences"    // Préférences de types de médias
  | "partnerNickname"     // Surnom personnalisé pour le partenaire
  | "premiumThemes"       // Thèmes 3-24 (premium)
  | "downloadMedia"       // Télécharger les médias reçus
  | "partnerChallenge"    // Créer un défi pour le partenaire (2 premium requis)
  | "extendedChallenges"  // Plus de 10 défis par session
  | "unlimitedGames"      // Parties illimitées par jour
  | "noAds"               // Sans publicités
  | "allToys";            // Accès aux défis avec jouets

/** Statut d'un abonnement */
export interface SubscriptionStatus {
  /** L'utilisateur est-il premium ? */
  isPremium: boolean;
  /** Plan d'abonnement actif */
  plan: PremiumPlan | null;
  /** Date d'expiration */
  expiresAt: Date | null;
  /** L'abonnement est-il expiré ? */
  isExpired: boolean;
  /** Jours restants avant expiration */
  daysRemaining: number | null;
}

/** Données de réception d'achat IAP */
export interface PurchaseReceipt {
  /** Token d'achat Google Play */
  purchaseToken: string;
  /** ID du produit acheté */
  productId: string;
  /** Date de l'achat */
  purchaseTime: number;
  /** Signature de vérification */
  signature?: string;
  /** ID de la commande */
  orderId?: string;
}

/** Résultat de vérification d'achat */
export interface VerifyPurchaseResult {
  isValid: boolean;
  plan: PremiumPlan | null;
  expirationDate: Date | null;
  error?: string;
}

// ============================================================
// MAPPING FEATURES -> REQUIREMENTS
// ============================================================

/**
 * Configuration des features premium
 * Définit les requirements pour chaque feature
 */
const FEATURE_CONFIG: Record<PremiumFeature, {
  requiresPremium: boolean;
  requiresBothPremium?: boolean;
  description: string;
}> = {
  level4: {
    requiresPremium: true,
    description: "Accès aux défis de niveau 4 (Explicite)",
  },
  unlimitedChanges: {
    requiresPremium: true,
    description: "Changements de défi illimités",
  },
  premiumReactions: {
    requiresPremium: true,
    description: "Réactions exclusives",
  },
  mediaPreferences: {
    requiresPremium: true,
    description: "Personnalisation des types de médias",
  },
  partnerNickname: {
    requiresPremium: true,
    description: "Surnom personnalisé pour le partenaire",
  },
  premiumThemes: {
    requiresPremium: true,
    description: "Thèmes premium (22 thèmes)",
  },
  downloadMedia: {
    requiresPremium: true,
    description: "Téléchargement des médias reçus",
  },
  partnerChallenge: {
    requiresPremium: true,
    requiresBothPremium: true,
    description: "Création de défis pour le partenaire",
  },
  extendedChallenges: {
    requiresPremium: true,
    description: "Sessions jusqu'à 50 défis",
  },
  unlimitedGames: {
    requiresPremium: true,
    description: "Parties illimitées par jour",
  },
  noAds: {
    requiresPremium: true,
    description: "Expérience sans publicités",
  },
  allToys: {
    requiresPremium: true,
    description: "Défis avec jouets",
  },
};

// ============================================================
// SERVICE SUBSCRIPTION
// ============================================================

export const subscriptionService = {
  // ----------------------------------------------------------
  // RÉCUPÉRATION DU STATUT D'ABONNEMENT
  // ----------------------------------------------------------

  /**
   * Récupère le statut d'abonnement complet d'un utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse avec le statut d'abonnement
   */
  async getSubscriptionStatus(
    userId: string
  ): Promise<ApiResponse<SubscriptionStatus>> {
    try {
      const doc = await usersCollection().doc(userId).get();

      if (!doc.exists()) {
        return {
          success: false,
          error: "Utilisateur introuvable",
        };
      }

      const userData = doc.data() as User;
      const now = new Date();

      // Calculer le statut
      let isPremium = userData.premium;
      let isExpired = false;
      let daysRemaining: number | null = null;
      let expiresAt: Date | null = null;

      if (userData.premiumUntil) {
        expiresAt = userData.premiumUntil.toDate();
        isExpired = expiresAt < now;
        isPremium = userData.premium && !isExpired;

        if (isPremium && expiresAt) {
          const diffTime = expiresAt.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // Si expiré mais marqué comme premium, désactiver automatiquement
      if (isExpired && userData.premium) {
        await this.deactivatePremium(userId);
      }

      const status: SubscriptionStatus = {
        isPremium,
        plan: isPremium ? userData.premiumPlan : null,
        expiresAt,
        isExpired,
        daysRemaining,
      };

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      console.error("[SubscriptionService] getSubscriptionStatus error:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération du statut",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION D'ACHAT IAP
  // ----------------------------------------------------------

  /**
   * Vérifie et valide un achat In-App Purchase
   *
   * Note: En production, cette vérification devrait être faite
   * côté serveur (Cloud Functions) pour plus de sécurité
   *
   * @param userId - UID de l'utilisateur
   * @param receipt - Données de réception de l'achat
   * @param productId - ID du produit acheté
   * @returns ApiResponse avec le résultat de vérification
   */
  async verifyPurchase(
    userId: string,
    receipt: PurchaseReceipt,
    productId: string
  ): Promise<ApiResponse<VerifyPurchaseResult>> {
    try {
      // Vérifier que le productId correspond à un produit connu
      let plan: PremiumPlan | null = null;

      if (productId === PRICING.MONTHLY.googlePlayId) {
        plan = "monthly";
      } else if (productId === PRICING.YEARLY.googlePlayId) {
        plan = "yearly";
      }

      if (!plan) {
        return {
          success: true,
          data: {
            isValid: false,
            plan: null,
            expirationDate: null,
            error: "Produit non reconnu",
          },
        };
      }

      // Vérifier que le receipt correspond au productId
      if (receipt.productId !== productId) {
        return {
          success: true,
          data: {
            isValid: false,
            plan: null,
            expirationDate: null,
            error: "Le reçu ne correspond pas au produit",
          },
        };
      }

      // TODO: En production, appeler une Cloud Function pour valider
      // avec l'API Google Play Developer pour une sécurité maximale
      // const verifyResponse = await functions().httpsCallable('verifyPurchase')({
      //   purchaseToken: receipt.purchaseToken,
      //   productId,
      // });

      // Pour le développement, on valide localement
      // (À remplacer par une vraie vérification serveur en production)

      // Calculer la date d'expiration
      const now = new Date();
      const expirationDate = new Date(now);

      if (plan === "monthly") {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      } else if (plan === "yearly") {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }

      // Activer le premium
      const activationResult = await this.activatePremium(
        userId,
        plan,
        expirationDate
      );

      if (!activationResult.success) {
        return {
          success: true,
          data: {
            isValid: false,
            plan: null,
            expirationDate: null,
            error: activationResult.error,
          },
        };
      }

      console.log(
        "[SubscriptionService] Purchase verified for:",
        userId,
        "| Plan:",
        plan
      );

      return {
        success: true,
        data: {
          isValid: true,
          plan,
          expirationDate,
        },
      };
    } catch (error: any) {
      console.error("[SubscriptionService] verifyPurchase error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification de l'achat",
      };
    }
  },

  // ----------------------------------------------------------
  // ACTIVATION DU PREMIUM
  // ----------------------------------------------------------

  /**
   * Active l'abonnement premium pour un utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @param plan - Plan d'abonnement (monthly/yearly)
   * @param expirationDate - Date d'expiration
   * @returns ApiResponse void
   */
  async activatePremium(
    userId: string,
    plan: PremiumPlan,
    expirationDate: Date
  ): Promise<ApiResponse> {
    try {
      const updateData = {
        premium: true,
        premiumPlan: plan,
        premiumUntil: toTimestamp(expirationDate),
      };

      await usersCollection().doc(userId).update(updateData);

      console.log(
        "[SubscriptionService] Premium activated for:",
        userId,
        "| Plan:",
        plan,
        "| Until:",
        expirationDate.toISOString()
      );

      return { success: true };
    } catch (error: any) {
      console.error("[SubscriptionService] activatePremium error:", error);
      return {
        success: false,
        error: "Erreur lors de l'activation premium",
      };
    }
  },

  // ----------------------------------------------------------
  // DÉSACTIVATION DU PREMIUM
  // ----------------------------------------------------------

  /**
   * Désactive l'abonnement premium pour un utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse void
   */
  async deactivatePremium(userId: string): Promise<ApiResponse> {
    try {
      const updateData = {
        premium: false,
        premiumPlan: null,
        premiumUntil: null,
      };

      await usersCollection().doc(userId).update(updateData);

      console.log("[SubscriptionService] Premium deactivated for:", userId);

      return { success: true };
    } catch (error: any) {
      console.error("[SubscriptionService] deactivatePremium error:", error);
      return {
        success: false,
        error: "Erreur lors de la désactivation premium",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION SIMPLE DU STATUT PREMIUM
  // ----------------------------------------------------------

  /**
   * Vérifie rapidement si un utilisateur est premium
   * (version légère de getSubscriptionStatus)
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse avec le statut boolean
   */
  async isUserPremium(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const doc = await usersCollection().doc(userId).get();

      if (!doc.exists()) {
        return {
          success: false,
          error: "Utilisateur introuvable",
        };
      }

      const userData = doc.data() as User;
      let isPremium = userData.premium;

      // Vérifier l'expiration
      if (isPremium && userData.premiumUntil) {
        const expiresAt = userData.premiumUntil.toDate();
        const now = new Date();

        if (expiresAt < now) {
          isPremium = false;
          // Désactiver automatiquement
          await this.deactivatePremium(userId);
        }
      }

      return {
        success: true,
        data: isPremium,
      };
    } catch (error: any) {
      console.error("[SubscriptionService] isUserPremium error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION DES DEUX PARTENAIRES PREMIUM
  // ----------------------------------------------------------

  /**
   * Vérifie si les deux joueurs d'une session sont premium
   * Utilisé pour les features qui nécessitent que les deux soient premium
   * (ex: partnerChallenge)
   *
   * @param sessionCode - Code de la session
   * @returns ApiResponse avec le statut
   */
  async areBothPremium(
    sessionCode: string
  ): Promise<ApiResponse<{
    bothPremium: boolean;
    creatorPremium: boolean;
    partnerPremium: boolean;
  }>> {
    try {
      // Récupérer la session
      const sessionDoc = await sessionsCollection().doc(sessionCode).get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: "Session introuvable",
        };
      }

      const session = sessionDoc.data() as Session;

      // Vérifier le créateur
      const creatorResult = await this.isUserPremium(session.creatorId);
      const creatorPremium = creatorResult.success && creatorResult.data === true;

      // Vérifier le partenaire (si présent)
      let partnerPremium = false;
      if (session.partnerId) {
        const partnerResult = await this.isUserPremium(session.partnerId);
        partnerPremium = partnerResult.success && partnerResult.data === true;
      }

      return {
        success: true,
        data: {
          bothPremium: creatorPremium && partnerPremium,
          creatorPremium,
          partnerPremium,
        },
      };
    } catch (error: any) {
      console.error("[SubscriptionService] areBothPremium error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification des abonnements",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION D'ACCÈS À UNE FEATURE
  // ----------------------------------------------------------

  /**
   * Vérifie si un utilisateur peut accéder à une feature premium
   *
   * @param userId - UID de l'utilisateur
   * @param feature - Feature à vérifier
   * @param sessionCode - Code de session (optionnel, pour les features nécessitant les 2 premium)
   * @returns ApiResponse avec le statut d'accès
   */
  async canAccessFeature(
    userId: string,
    feature: PremiumFeature,
    sessionCode?: string
  ): Promise<ApiResponse<{
    canAccess: boolean;
    reason?: string;
  }>> {
    try {
      const config = FEATURE_CONFIG[feature];

      if (!config) {
        return {
          success: false,
          error: "Feature inconnue",
        };
      }

      // Si la feature ne nécessite pas premium, accès autorisé
      if (!config.requiresPremium) {
        return {
          success: true,
          data: { canAccess: true },
        };
      }

      // Vérifier le statut premium de l'utilisateur
      const premiumResult = await this.isUserPremium(userId);

      if (!premiumResult.success) {
        return {
          success: false,
          error: premiumResult.error,
        };
      }

      const isPremium = premiumResult.data;

      // Si l'utilisateur n'est pas premium
      if (!isPremium) {
        return {
          success: true,
          data: {
            canAccess: false,
            reason: `${config.description} nécessite un abonnement Premium`,
          },
        };
      }

      // Si la feature nécessite que les deux soient premium
      if (config.requiresBothPremium) {
        if (!sessionCode) {
          return {
            success: true,
            data: {
              canAccess: false,
              reason: "Code de session requis pour cette feature",
            },
          };
        }

        const bothResult = await this.areBothPremium(sessionCode);

        if (!bothResult.success) {
          return {
            success: false,
            error: bothResult.error,
          };
        }

        if (!bothResult.data?.bothPremium) {
          return {
            success: true,
            data: {
              canAccess: false,
              reason: "Les deux partenaires doivent être Premium pour cette fonctionnalité",
            },
          };
        }
      }

      // Accès autorisé
      return {
        success: true,
        data: { canAccess: true },
      };
    } catch (error: any) {
      console.error("[SubscriptionService] canAccessFeature error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification d'accès",
      };
    }
  },

  // ----------------------------------------------------------
  // HELPERS UTILITAIRES
  // ----------------------------------------------------------

  /**
   * Récupère la liste des features accessibles pour un utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse avec la liste des features accessibles
   */
  async getAccessibleFeatures(
    userId: string
  ): Promise<ApiResponse<PremiumFeature[]>> {
    try {
      const premiumResult = await this.isUserPremium(userId);

      if (!premiumResult.success) {
        return {
          success: false,
          error: premiumResult.error,
        };
      }

      const isPremium = premiumResult.data;
      const accessibleFeatures: PremiumFeature[] = [];

      for (const [feature, config] of Object.entries(FEATURE_CONFIG)) {
        // Features ne nécessitant pas premium ou user premium
        if (!config.requiresPremium || isPremium) {
          // Exclure les features nécessitant les 2 premium (vérification spécifique)
          if (!config.requiresBothPremium) {
            accessibleFeatures.push(feature as PremiumFeature);
          }
        }
      }

      return {
        success: true,
        data: accessibleFeatures,
      };
    } catch (error: any) {
      console.error("[SubscriptionService] getAccessibleFeatures error:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des features",
      };
    }
  },

  /**
   * Récupère les infos de pricing
   *
   * @returns Infos de pricing
   */
  getPricingInfo() {
    return {
      monthly: {
        price: PRICING.MONTHLY.price,
        priceFormatted: PRICING.MONTHLY.priceFormatted,
        sku: PRICING.MONTHLY.sku,
      },
      yearly: {
        price: PRICING.YEARLY.price,
        priceFormatted: PRICING.YEARLY.priceFormatted,
        sku: PRICING.YEARLY.sku,
        savingsPercent: PRICING.YEARLY.savingsPercent,
        savingsFormatted: PRICING.YEARLY.savingsFormatted,
        monthlyEquivalentFormatted: PRICING.YEARLY.monthlyEquivalentFormatted,
      },
    };
  },

  /**
   * Récupère la configuration d'une feature
   *
   * @param feature - Feature à récupérer
   * @returns Configuration de la feature
   */
  getFeatureConfig(feature: PremiumFeature) {
    return FEATURE_CONFIG[feature] || null;
  },

  /**
   * Récupère toutes les réactions premium disponibles
   */
  getPremiumReactions() {
    return [...REACTIONS_PREMIUM];
  },

  /**
   * Récupère tous les thèmes premium disponibles
   */
  getPremiumThemes() {
    return [...THEMES_PREMIUM];
  },

  /**
   * Calcule la date d'expiration pour un plan donné
   *
   * @param plan - Plan d'abonnement
   * @param fromDate - Date de départ (défaut: maintenant)
   * @returns Date d'expiration
   */
  calculateExpirationDate(plan: PremiumPlan, fromDate?: Date): Date {
    const date = fromDate ? new Date(fromDate) : new Date();

    if (plan === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else if (plan === "yearly") {
      date.setFullYear(date.getFullYear() + 1);
    }

    return date;
  },

  /**
   * Prolonge un abonnement existant
   *
   * @param userId - UID de l'utilisateur
   * @param plan - Plan à ajouter
   * @returns ApiResponse void
   */
  async extendSubscription(
    userId: string,
    plan: PremiumPlan
  ): Promise<ApiResponse> {
    try {
      // Récupérer le statut actuel
      const statusResult = await this.getSubscriptionStatus(userId);

      if (!statusResult.success || !statusResult.data) {
        return {
          success: false,
          error: statusResult.error || "Impossible de récupérer le statut",
        };
      }

      const currentStatus = statusResult.data;
      let newExpirationDate: Date;

      if (currentStatus.isPremium && currentStatus.expiresAt) {
        // Prolonger à partir de la date d'expiration actuelle
        newExpirationDate = this.calculateExpirationDate(
          plan,
          currentStatus.expiresAt
        );
      } else {
        // Nouvelle activation
        newExpirationDate = this.calculateExpirationDate(plan);
      }

      return this.activatePremium(userId, plan, newExpirationDate);
    } catch (error: any) {
      console.error("[SubscriptionService] extendSubscription error:", error);
      return {
        success: false,
        error: "Erreur lors de la prolongation de l'abonnement",
      };
    }
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default subscriptionService;