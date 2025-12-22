/**
 * Service de gestion des achats In-App (IAP)
 *
 * Gère l'intégration avec Google Play Billing :
 * - Initialisation de la connexion
 * - Récupération des produits
 * - Achat d'abonnements
 * - Restauration des achats
 *
 * PROMPT 7.2 : Service IAP
 *
 * Note: Utilise react-native-iap pour les achats
 * Installation: npm install react-native-iap
 */

import { Platform } from "react-native";
import { PRICING } from "../utils/constants";
import { PremiumPlan, ApiResponse } from "../types";
import {
  subscriptionService,
  PurchaseReceipt,
} from "./subscription.service";

// ============================================================
// TYPES
// ============================================================

/** Produit IAP */
export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
  subscriptionPeriod?: string;
}

/** Achat IAP */
export interface IAPPurchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseToken?: string; // Android
  originalTransactionId?: string;
}

/** État de connexion IAP */
export type IAPConnectionState = "disconnected" | "connecting" | "connected" | "error";

/** Résultat d'achat */
export interface PurchaseResult {
  success: boolean;
  purchase?: IAPPurchase;
  error?: string;
}

// ============================================================
// PRODUCT IDS
// ============================================================

/** IDs des produits sur Google Play */
export const PRODUCT_IDS = {
  MONTHLY: PRICING.MONTHLY.googlePlayId, // "intimacy_play_premium_monthly"
  YEARLY: PRICING.YEARLY.googlePlayId,   // "intimacy_play_premium_yearly"
} as const;

/** Liste des IDs de produits d'abonnement */
export const SUBSCRIPTION_SKUS: readonly string[] = [
  PRODUCT_IDS.MONTHLY,
  PRODUCT_IDS.YEARLY,
];

// ============================================================
// SERVICE IAP
// ============================================================

/**
 * Service IAP
 *
 * Note: Les imports de react-native-iap sont conditionnels car le package
 * n'est pas encore installé. En production, décommentez les imports.
 */
export const iapService = {
  // État interne
  _isInitialized: false,
  _connectionState: "disconnected" as IAPConnectionState,
  _products: [] as IAPProduct[],
  _purchaseUpdateSubscription: null as any,
  _purchaseErrorSubscription: null as any,

  // ----------------------------------------------------------
  // INITIALISATION
  // ----------------------------------------------------------

  /**
   * Initialise la connexion IAP
   *
   * @returns Promise<ApiResponse> avec le statut d'initialisation
   */
  async initIAP(): Promise<ApiResponse<{ connected: boolean }>> {
    if (this._isInitialized) {
      console.log("[IAPService] Already initialized");
      return { success: true, data: { connected: true } };
    }

    try {
      this._connectionState = "connecting";

      // ============================================
      // TODO: Décommenter quand react-native-iap est installé
      // ============================================
      // import {
      //   initConnection,
      //   endConnection,
      //   getSubscriptions,
      //   requestSubscription,
      //   purchaseUpdatedListener,
      //   purchaseErrorListener,
      //   finishTransaction,
      //   getAvailablePurchases,
      // } from 'react-native-iap';
      //
      // const result = await initConnection();
      // console.log("[IAPService] Connection initialized:", result);
      //
      // // Écouter les mises à jour d'achats
      // this._purchaseUpdateSubscription = purchaseUpdatedListener(
      //   async (purchase) => {
      //     console.log("[IAPService] Purchase updated:", purchase);
      //     // Le traitement sera fait dans purchaseSubscription
      //   }
      // );
      //
      // // Écouter les erreurs d'achats
      // this._purchaseErrorSubscription = purchaseErrorListener((error) => {
      //   console.error("[IAPService] Purchase error:", error);
      // });

      // Pour le développement sans react-native-iap
      console.log("[IAPService] Mock initialization (react-native-iap not installed)");
      await this._mockDelay(500);

      this._isInitialized = true;
      this._connectionState = "connected";

      console.log("[IAPService] Initialized successfully");

      return {
        success: true,
        data: { connected: true },
      };
    } catch (error: any) {
      console.error("[IAPService] Init error:", error);
      this._connectionState = "error";

      return {
        success: false,
        error: "Impossible de se connecter au store",
      };
    }
  },

  // ----------------------------------------------------------
  // RÉCUPÉRATION DES PRODUITS
  // ----------------------------------------------------------

  /**
   * Récupère les produits d'abonnement disponibles
   *
   * @returns Promise<ApiResponse<IAPProduct[]>> avec la liste des produits
   */
  async getProducts(): Promise<ApiResponse<IAPProduct[]>> {
    try {
      // S'assurer que IAP est initialisé
      if (!this._isInitialized) {
        const initResult = await this.initIAP();
        if (!initResult.success) {
          return { success: false, error: initResult.error };
        }
      }

      // ============================================
      // TODO: Décommenter quand react-native-iap est installé
      // ============================================
      // import { getSubscriptions } from 'react-native-iap';
      //
      // const subscriptions = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
      //
      // const products: IAPProduct[] = subscriptions.map((sub) => ({
      //   productId: sub.productId,
      //   title: sub.title,
      //   description: sub.description,
      //   price: sub.price,
      //   currency: sub.currency,
      //   localizedPrice: sub.localizedPrice,
      //   subscriptionPeriod: sub.subscriptionPeriodAndroid,
      // }));

      // Produits mock pour le développement
      const products: IAPProduct[] = [
        {
          productId: PRODUCT_IDS.MONTHLY,
          title: "Premium Mensuel",
          description: "Accès à toutes les fonctionnalités premium pendant 1 mois",
          price: PRICING.MONTHLY.price.toString(),
          currency: PRICING.MONTHLY.currency,
          localizedPrice: PRICING.MONTHLY.priceFormatted,
          subscriptionPeriod: "P1M",
        },
        {
          productId: PRODUCT_IDS.YEARLY,
          title: "Premium Annuel",
          description: "Accès à toutes les fonctionnalités premium pendant 1 an",
          price: PRICING.YEARLY.price.toString(),
          currency: PRICING.YEARLY.currency,
          localizedPrice: PRICING.YEARLY.priceFormatted,
          subscriptionPeriod: "P1Y",
        },
      ];

      this._products = products;

      console.log("[IAPService] Products fetched:", products.length);

      return {
        success: true,
        data: products,
      };
    } catch (error: any) {
      console.error("[IAPService] Get products error:", error);
      return {
        success: false,
        error: "Impossible de récupérer les produits",
      };
    }
  },

  // ----------------------------------------------------------
  // ACHAT D'ABONNEMENT
  // ----------------------------------------------------------

  /**
   * Lance l'achat d'un abonnement
   *
   * @param productId - ID du produit à acheter
   * @param userId - ID de l'utilisateur (pour l'activation)
   * @returns Promise<ApiResponse<PurchaseResult>>
   */
  async purchaseSubscription(
    productId: string,
    userId: string
  ): Promise<ApiResponse<PurchaseResult>> {
    try {
      // Vérifier que le produit existe
      if (!SUBSCRIPTION_SKUS.includes(productId)) {
        return {
          success: false,
          error: "Produit non reconnu",
        };
      }

      // S'assurer que IAP est initialisé
      if (!this._isInitialized) {
        const initResult = await this.initIAP();
        if (!initResult.success) {
          return { success: false, error: initResult.error };
        }
      }

      console.log("[IAPService] Starting purchase for:", productId);

      // ============================================
      // TODO: Décommenter quand react-native-iap est installé
      // ============================================
      // import {
      //   requestSubscription,
      //   finishTransaction,
      //   SubscriptionAndroid,
      // } from 'react-native-iap';
      //
      // // Lancer l'achat
      // const purchase = await requestSubscription({
      //   sku: productId,
      //   ...(Platform.OS === 'android' && {
      //     subscriptionOffers: [{ sku: productId, offerToken: '' }],
      //   }),
      // });
      //
      // if (!purchase) {
      //   return {
      //     success: true,
      //     data: { success: false, error: "Achat annulé" },
      //   };
      // }
      //
      // // Créer le receipt pour vérification
      // const receipt: PurchaseReceipt = {
      //   purchaseToken: purchase.purchaseToken || '',
      //   productId: purchase.productId,
      //   purchaseTime: purchase.transactionDate,
      //   signature: purchase.signatureAndroid,
      //   orderId: purchase.transactionId,
      // };
      //
      // // Vérifier et activer le premium
      // const verifyResult = await subscriptionService.verifyPurchase(
      //   userId,
      //   receipt,
      //   productId
      // );
      //
      // if (verifyResult.success && verifyResult.data?.isValid) {
      //   // Finaliser la transaction
      //   await finishTransaction({ purchase, isConsumable: false });
      //
      //   return {
      //     success: true,
      //     data: {
      //       success: true,
      //       purchase: {
      //         productId: purchase.productId,
      //         transactionId: purchase.transactionId,
      //         transactionDate: purchase.transactionDate,
      //         transactionReceipt: purchase.transactionReceipt,
      //         purchaseToken: purchase.purchaseToken,
      //       },
      //     },
      //   };
      // }
      //
      // return {
      //   success: true,
      //   data: {
      //     success: false,
      //     error: verifyResult.data?.error || "Vérification échouée",
      //   },
      // };

      // Mock pour le développement
      console.log("[IAPService] Mock purchase (react-native-iap not installed)");

      // Simuler un délai d'achat
      await this._mockDelay(1500);

      // Simuler un achat réussi
      const mockPurchase: IAPPurchase = {
        productId,
        transactionId: `mock_${Date.now()}`,
        transactionDate: Date.now(),
        transactionReceipt: "mock_receipt",
        purchaseToken: `mock_token_${Date.now()}`,
      };

      // Créer le receipt pour vérification
      const receipt: PurchaseReceipt = {
        purchaseToken: mockPurchase.purchaseToken || "",
        productId: mockPurchase.productId,
        purchaseTime: mockPurchase.transactionDate,
        orderId: mockPurchase.transactionId,
      };

      // Vérifier et activer le premium
      const verifyResult = await subscriptionService.verifyPurchase(
        userId,
        receipt,
        productId
      );

      if (verifyResult.success && verifyResult.data?.isValid) {
        console.log("[IAPService] Purchase successful (mock)");

        return {
          success: true,
          data: {
            success: true,
            purchase: mockPurchase,
          },
        };
      }

      return {
        success: true,
        data: {
          success: false,
          error: verifyResult.data?.error || "Vérification échouée",
        },
      };
    } catch (error: any) {
      console.error("[IAPService] Purchase error:", error);

      // Gérer les erreurs spécifiques
      if (error.code === "E_USER_CANCELLED") {
        return {
          success: true,
          data: { success: false, error: "Achat annulé" },
        };
      }

      return {
        success: false,
        error: error.message || "Erreur lors de l'achat",
      };
    }
  },

  // ----------------------------------------------------------
  // RESTAURATION DES ACHATS
  // ----------------------------------------------------------

  /**
   * Restaure les achats précédents
   *
   * @param userId - ID de l'utilisateur
   * @returns Promise<ApiResponse<{ restored: boolean; plan?: PremiumPlan }>>
   */
  async restorePurchases(
    userId: string
  ): Promise<ApiResponse<{ restored: boolean; plan?: PremiumPlan }>> {
    try {
      // S'assurer que IAP est initialisé
      if (!this._isInitialized) {
        const initResult = await this.initIAP();
        if (!initResult.success) {
          return { success: false, error: initResult.error };
        }
      }

      console.log("[IAPService] Restoring purchases for:", userId);

      // ============================================
      // TODO: Décommenter quand react-native-iap est installé
      // ============================================
      // import { getAvailablePurchases } from 'react-native-iap';
      //
      // const purchases = await getAvailablePurchases();
      //
      // // Filtrer les achats d'abonnement valides
      // const validSubscriptions = purchases.filter(
      //   (p) => SUBSCRIPTION_SKUS.includes(p.productId)
      // );
      //
      // if (validSubscriptions.length === 0) {
      //   return {
      //     success: true,
      //     data: { restored: false },
      //   };
      // }
      //
      // // Prendre l'achat le plus récent
      // const latestPurchase = validSubscriptions.sort(
      //   (a, b) => b.transactionDate - a.transactionDate
      // )[0];
      //
      // // Vérifier et activer
      // const receipt: PurchaseReceipt = {
      //   purchaseToken: latestPurchase.purchaseToken || '',
      //   productId: latestPurchase.productId,
      //   purchaseTime: latestPurchase.transactionDate,
      //   signature: latestPurchase.signatureAndroid,
      //   orderId: latestPurchase.transactionId,
      // };
      //
      // const verifyResult = await subscriptionService.verifyPurchase(
      //   userId,
      //   receipt,
      //   latestPurchase.productId
      // );
      //
      // if (verifyResult.success && verifyResult.data?.isValid) {
      //   return {
      //     success: true,
      //     data: {
      //       restored: true,
      //       plan: verifyResult.data.plan || undefined,
      //     },
      //   };
      // }
      //
      // return {
      //   success: true,
      //   data: { restored: false },
      // };

      // Mock pour le développement
      console.log("[IAPService] Mock restore (react-native-iap not installed)");
      await this._mockDelay(1000);

      // Simuler qu'aucun achat n'a été trouvé
      return {
        success: true,
        data: { restored: false },
      };
    } catch (error: any) {
      console.error("[IAPService] Restore error:", error);
      return {
        success: false,
        error: "Impossible de restaurer les achats",
      };
    }
  },

  // ----------------------------------------------------------
  // NETTOYAGE
  // ----------------------------------------------------------

  /**
   * Nettoie les connexions IAP
   */
  async cleanup(): Promise<void> {
    try {
      // ============================================
      // TODO: Décommenter quand react-native-iap est installé
      // ============================================
      // import { endConnection } from 'react-native-iap';
      //
      // if (this._purchaseUpdateSubscription) {
      //   this._purchaseUpdateSubscription.remove();
      //   this._purchaseUpdateSubscription = null;
      // }
      //
      // if (this._purchaseErrorSubscription) {
      //   this._purchaseErrorSubscription.remove();
      //   this._purchaseErrorSubscription = null;
      // }
      //
      // await endConnection();

      this._isInitialized = false;
      this._connectionState = "disconnected";
      this._products = [];

      console.log("[IAPService] Cleanup complete");
    } catch (error) {
      console.error("[IAPService] Cleanup error:", error);
    }
  },

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  /**
   * Vérifie si IAP est disponible
   */
  isAvailable(): boolean {
    return Platform.OS === "android" || Platform.OS === "ios";
  },

  /**
   * Récupère l'état de connexion
   */
  getConnectionState(): IAPConnectionState {
    return this._connectionState;
  },

  /**
   * Récupère les produits en cache
   */
  getCachedProducts(): IAPProduct[] {
    return this._products;
  },

  /**
   * Récupère le plan à partir d'un productId
   */
  getPlanFromProductId(productId: string): PremiumPlan | null {
    if (productId === PRODUCT_IDS.MONTHLY) return "monthly";
    if (productId === PRODUCT_IDS.YEARLY) return "yearly";
    return null;
  },

  /**
   * Helper pour simuler un délai (dev)
   */
  async _mockDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default iapService;