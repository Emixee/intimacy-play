/**
 * Service de gestion des publicités AdMob
 *
 * Gère toutes les opérations liées aux publicités :
 * - Initialisation AdMob
 * - Interstitial au début de partie (gratuit)
 * - Rewarded pour +1 partie gratuite (max 3/jour)
 * - Rewarded pour +1 changement (max 3/partie)
 *
 * PROMPT 7.3 : Service Publicités
 *
 * Note: Utilise react-native-google-mobile-ads
 * Installation: npm install react-native-google-mobile-ads
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ApiResponse } from "../types";
import { LIMITS, STORAGE_KEYS } from "../utils/constants";

// ============================================================
// IDS ADMOB
// ============================================================

/**
 * IDs des annonces AdMob
 *
 * En développement, utilise les IDs de test officiels
 * En production, remplacer par vos propres IDs
 */
export const AD_UNIT_IDS = {
  // IDs de test AdMob officiels
  TEST: {
    INTERSTITIAL: Platform.select({
      ios: "ca-app-pub-3940256099942544/4411468910",
      android: "ca-app-pub-3940256099942544/1033173712",
    }) as string,
    REWARDED: Platform.select({
      ios: "ca-app-pub-3940256099942544/1712485313",
      android: "ca-app-pub-3940256099942544/5224354917",
    }) as string,
    BANNER: Platform.select({
      ios: "ca-app-pub-3940256099942544/2934735716",
      android: "ca-app-pub-3940256099942544/6300978111",
    }) as string,
  },
  // IDs de production (à remplacer par vos propres IDs)
  PRODUCTION: {
    INTERSTITIAL: Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      android: "ca-app-pub-4902274309112105/2067393503",
    }) as string,
    REWARDED: Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      android: "ca-app-pub-4902274309112105/9408479866",
    }) as string,
    BANNER: Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
    }) as string,
  },
} as const;

/**
 * Mode développement/production
 * Basculer sur false pour la production
 */
const IS_DEV_MODE = __DEV__ || true;

/**
 * Récupère l'ID d'annonce approprié
 */
const getAdUnitId = (type: "INTERSTITIAL" | "REWARDED" | "BANNER"): string => {
  return IS_DEV_MODE ? AD_UNIT_IDS.TEST[type] : AD_UNIT_IDS.PRODUCTION[type];
};

// ============================================================
// TYPES
// ============================================================

/** Résultat d'une pub rewarded */
export interface RewardedAdResult {
  /** La pub a été regardée jusqu'au bout */
  rewarded: boolean;
  /** La récompense accordée */
  rewardType: "game" | "change";
  /** Montant de la récompense */
  rewardAmount: number;
  /** Message d'erreur si échec */
  error?: string;
}

/** État de la connexion AdMob */
export type AdMobConnectionState =
  | "not_initialized"
  | "initializing"
  | "initialized"
  | "error";

/** État du chargement d'une pub */
export type AdLoadState =
  | "not_loaded"
  | "loading"
  | "loaded"
  | "showing"
  | "error";

// ============================================================
// LIMITES
// ============================================================

/** Maximum de parties gratuites obtenues par pub par jour */
const MAX_FREE_GAMES_FROM_ADS = LIMITS.FREE_GAMES_PER_DAY; // 3

/** Maximum de changements bonus par partie */
const MAX_AD_CHANGES_PER_SESSION = LIMITS.CHANGES.BONUS_FROM_ADS; // 3

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEY_FREE_GAMES = STORAGE_KEYS.FREE_GAMES_TODAY;
const STORAGE_KEY_LAST_DATE = STORAGE_KEYS.FREE_GAMES_DATE;

// ============================================================
// SERVICE PUBLICITÉS
// ============================================================

export const adsService = {
  // État interne
  _isInitialized: false,
  _connectionState: "not_initialized" as AdMobConnectionState,
  _interstitialLoaded: false,
  _rewardedLoaded: false,
  _interstitialLoadState: "not_loaded" as AdLoadState,
  _rewardedLoadState: "not_loaded" as AdLoadState,

  // ----------------------------------------------------------
  // INITIALISATION
  // ----------------------------------------------------------

  /**
   * Initialise le SDK AdMob
   *
   * @returns Promise<ApiResponse> avec le statut d'initialisation
   */
  async initAds(): Promise<ApiResponse<{ initialized: boolean }>> {
    if (this._isInitialized) {
      console.log("[AdsService] Already initialized");
      return { success: true, data: { initialized: true } };
    }

    try {
      this._connectionState = "initializing";

      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
      //
      // await mobileAds().initialize();
      //
      // // Configuration du contenu des annonces
      // await mobileAds().setRequestConfiguration({
      //   // Contenu adapté aux adultes (18+)
      //   maxAdContentRating: MaxAdContentRating.MA,
      //   // Liste de device IDs de test (en développement)
      //   testDeviceIdentifiers: ['EMULATOR'],
      // });

      // Mock pour le développement
      console.log(
        "[AdsService] Mock initialization (react-native-google-mobile-ads not installed)"
      );
      await this._mockDelay(500);

      this._isInitialized = true;
      this._connectionState = "initialized";

      // Précharger les pubs
      await this.preloadAds();

      console.log("[AdsService] Initialized successfully");

      return {
        success: true,
        data: { initialized: true },
      };
    } catch (error: any) {
      console.error("[AdsService] Init error:", error);
      this._connectionState = "error";

      return {
        success: false,
        error: "Impossible d'initialiser les publicités",
      };
    }
  },

  /**
   * Précharge les publicités pour un affichage plus rapide
   */
  async preloadAds(): Promise<void> {
    await Promise.all([this._loadInterstitial(), this._loadRewarded()]);
  },

  // ----------------------------------------------------------
  // INTERSTITIAL
  // ----------------------------------------------------------

  /**
   * Charge une publicité interstitielle
   */
  async _loadInterstitial(): Promise<boolean> {
    if (this._interstitialLoadState === "loading") {
      return false;
    }

    this._interstitialLoadState = "loading";

    try {
      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
      //
      // const interstitial = InterstitialAd.createForAdRequest(
      //   getAdUnitId('INTERSTITIAL'),
      //   {
      //     requestNonPersonalizedAdsOnly: false,
      //   }
      // );
      //
      // return new Promise((resolve) => {
      //   interstitial.addAdEventListener(AdEventType.LOADED, () => {
      //     this._interstitialLoaded = true;
      //     this._interstitialLoadState = 'loaded';
      //     resolve(true);
      //   });
      //
      //   interstitial.addAdEventListener(AdEventType.ERROR, () => {
      //     this._interstitialLoadState = 'error';
      //     resolve(false);
      //   });
      //
      //   interstitial.load();
      // });

      // Mock
      await this._mockDelay(300);
      this._interstitialLoaded = true;
      this._interstitialLoadState = "loaded";
      return true;
    } catch (error) {
      console.error("[AdsService] Load interstitial error:", error);
      this._interstitialLoadState = "error";
      return false;
    }
  },

  /**
   * Affiche une publicité interstitielle
   * Utilisée au début d'une partie pour les utilisateurs gratuits
   *
   * @param isPremium - Si l'utilisateur est premium (ne pas afficher)
   * @returns Promise<ApiResponse> avec le statut
   */
  async showInterstitial(
    isPremium: boolean = false
  ): Promise<ApiResponse<{ shown: boolean }>> {
    // Ne pas afficher de pub aux utilisateurs premium
    if (isPremium) {
      console.log("[AdsService] User is premium, skipping interstitial");
      return { success: true, data: { shown: false } };
    }

    try {
      // Charger si pas déjà fait
      if (!this._interstitialLoaded) {
        const loaded = await this._loadInterstitial();
        if (!loaded) {
          console.warn("[AdsService] Interstitial not loaded, skipping");
          return { success: true, data: { shown: false } };
        }
      }

      this._interstitialLoadState = "showing";

      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // await interstitial.show();

      // Mock
      console.log("[AdsService] Mock showing interstitial");
      await this._mockDelay(1500);

      // Recharger pour la prochaine fois
      this._interstitialLoaded = false;
      this._loadInterstitial();

      console.log("[AdsService] Interstitial shown successfully");

      return {
        success: true,
        data: { shown: true },
      };
    } catch (error: any) {
      console.error("[AdsService] Show interstitial error:", error);
      this._interstitialLoadState = "error";

      return {
        success: false,
        error: "Erreur lors de l'affichage de la publicité",
      };
    }
  },

  // ----------------------------------------------------------
  // REWARDED
  // ----------------------------------------------------------

  /**
   * Charge une publicité rewarded
   */
  async _loadRewarded(): Promise<boolean> {
    if (this._rewardedLoadState === "loading") {
      return false;
    }

    this._rewardedLoadState = "loading";

    try {
      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
      //
      // const rewarded = RewardedAd.createForAdRequest(
      //   getAdUnitId('REWARDED'),
      //   {
      //     requestNonPersonalizedAdsOnly: false,
      //   }
      // );
      //
      // return new Promise((resolve) => {
      //   rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      //     this._rewardedLoaded = true;
      //     this._rewardedLoadState = 'loaded';
      //     resolve(true);
      //   });
      //
      //   rewarded.addAdEventListener(RewardedAdEventType.ERROR, () => {
      //     this._rewardedLoadState = 'error';
      //     resolve(false);
      //   });
      //
      //   rewarded.load();
      // });

      // Mock
      await this._mockDelay(300);
      this._rewardedLoaded = true;
      this._rewardedLoadState = "loaded";
      return true;
    } catch (error) {
      console.error("[AdsService] Load rewarded error:", error);
      this._rewardedLoadState = "error";
      return false;
    }
  },

  /**
   * Affiche une publicité rewarded pour obtenir une partie gratuite supplémentaire
   * Maximum 3 parties gratuites par jour via publicités
   *
   * @param currentFreeGamesToday - Nombre de parties gratuites déjà obtenues aujourd'hui
   * @returns Promise<ApiResponse<RewardedAdResult>>
   */
  async showRewardedForGame(
    currentFreeGamesToday: number
  ): Promise<ApiResponse<RewardedAdResult>> {
    // Vérifier la limite quotidienne
    if (currentFreeGamesToday >= MAX_FREE_GAMES_FROM_ADS) {
      return {
        success: false,
        error: `Vous avez atteint le maximum de ${MAX_FREE_GAMES_FROM_ADS} parties gratuites par jour`,
      };
    }

    try {
      // Charger si pas déjà fait
      if (!this._rewardedLoaded) {
        const loaded = await this._loadRewarded();
        if (!loaded) {
          return {
            success: false,
            error: "La publicité n'a pas pu être chargée",
          };
        }
      }

      this._rewardedLoadState = "showing";

      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // const result = await new Promise<RewardedAdResult>((resolve) => {
      //   let rewarded = false;
      //
      //   rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      //     rewarded = true;
      //   });
      //
      //   rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      //     resolve({
      //       rewarded,
      //       rewardType: 'game',
      //       rewardAmount: rewarded ? 1 : 0,
      //     });
      //   });
      //
      //   rewarded.show();
      // });

      // Mock - Simule un visionnage réussi
      console.log("[AdsService] Mock showing rewarded ad for game");
      await this._mockDelay(2000);

      const result: RewardedAdResult = {
        rewarded: true,
        rewardType: "game",
        rewardAmount: 1,
      };

      // Recharger pour la prochaine fois
      this._rewardedLoaded = false;
      this._loadRewarded();

      console.log("[AdsService] Rewarded ad for game completed");

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error("[AdsService] Show rewarded for game error:", error);
      this._rewardedLoadState = "error";

      return {
        success: false,
        error: "La publicité n'a pas pu être affichée",
      };
    }
  },

  /**
   * Affiche une publicité rewarded pour obtenir un changement supplémentaire
   * Maximum 3 changements bonus par partie via publicités
   *
   * @param currentAdChanges - Nombre de changements bonus déjà obtenus cette partie
   * @returns Promise<ApiResponse<RewardedAdResult>>
   */
  async showRewardedForChange(
    currentAdChanges: number
  ): Promise<ApiResponse<RewardedAdResult>> {
    // Vérifier la limite par session
    if (currentAdChanges >= MAX_AD_CHANGES_PER_SESSION) {
      return {
        success: false,
        error: `Vous avez atteint le maximum de ${MAX_AD_CHANGES_PER_SESSION} changements bonus par partie`,
      };
    }

    try {
      // Charger si pas déjà fait
      if (!this._rewardedLoaded) {
        const loaded = await this._loadRewarded();
        if (!loaded) {
          return {
            success: false,
            error: "La publicité n'a pas pu être chargée",
          };
        }
      }

      this._rewardedLoadState = "showing";

      // ============================================
      // TODO: Décommenter quand react-native-google-mobile-ads est installé
      // ============================================
      // (Même logique que showRewardedForGame)

      // Mock - Simule un visionnage réussi
      console.log("[AdsService] Mock showing rewarded ad for change");
      await this._mockDelay(2000);

      const result: RewardedAdResult = {
        rewarded: true,
        rewardType: "change",
        rewardAmount: 1,
      };

      // Recharger pour la prochaine fois
      this._rewardedLoaded = false;
      this._loadRewarded();

      console.log("[AdsService] Rewarded ad for change completed");

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error("[AdsService] Show rewarded for change error:", error);
      this._rewardedLoadState = "error";

      return {
        success: false,
        error: "La publicité n'a pas pu être affichée",
      };
    }
  },

  // ----------------------------------------------------------
  // GESTION DES PARTIES GRATUITES (avec expo-secure-store)
  // ----------------------------------------------------------

  /**
   * Récupère le nombre de parties gratuites obtenues aujourd'hui via pub
   */
  async getFreeGamesToday(): Promise<number> {
    try {
      const lastDateStr = await SecureStore.getItemAsync(STORAGE_KEY_LAST_DATE);
      const today = this._getTodayString();

      // Si la date a changé, réinitialiser
      if (lastDateStr !== today) {
        await SecureStore.setItemAsync(STORAGE_KEY_LAST_DATE, today);
        await SecureStore.setItemAsync(STORAGE_KEY_FREE_GAMES, "0");
        return 0;
      }

      const countStr = await SecureStore.getItemAsync(STORAGE_KEY_FREE_GAMES);
      return parseInt(countStr || "0", 10);
    } catch (error) {
      console.error("[AdsService] getFreeGamesToday error:", error);
      return 0;
    }
  },

  /**
   * Incrémente le compteur de parties gratuites
   */
  async incrementFreeGames(): Promise<number> {
    try {
      const current = await this.getFreeGamesToday();
      const newCount = Math.min(current + 1, MAX_FREE_GAMES_FROM_ADS);

      await SecureStore.setItemAsync(
        STORAGE_KEY_FREE_GAMES,
        newCount.toString()
      );
      await SecureStore.setItemAsync(
        STORAGE_KEY_LAST_DATE,
        this._getTodayString()
      );

      return newCount;
    } catch (error) {
      console.error("[AdsService] incrementFreeGames error:", error);
      return 0;
    }
  },

  /**
   * Vérifie si l'utilisateur peut regarder une pub pour une partie gratuite
   */
  async canWatchAdForGame(): Promise<boolean> {
    const freeGamesToday = await this.getFreeGamesToday();
    return freeGamesToday < MAX_FREE_GAMES_FROM_ADS;
  },

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  /**
   * Récupère la date du jour au format YYYY-MM-DD
   */
  _getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  },

  /**
   * Vérifie si AdMob est initialisé
   */
  isInitialized(): boolean {
    return this._isInitialized;
  },

  /**
   * Récupère l'état de connexion
   */
  getConnectionState(): AdMobConnectionState {
    return this._connectionState;
  },

  /**
   * Vérifie si une pub rewarded est prête
   */
  isRewardedReady(): boolean {
    return this._rewardedLoaded;
  },

  /**
   * Vérifie si une pub interstitielle est prête
   */
  isInterstitialReady(): boolean {
    return this._interstitialLoaded;
  },

  /**
   * Helper pour simuler un délai (dev)
   */
  async _mockDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Récupère les limites
   */
  getLimits() {
    return {
      maxFreeGamesPerDay: MAX_FREE_GAMES_FROM_ADS,
      maxAdChangesPerSession: MAX_AD_CHANGES_PER_SESSION,
    };
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default adsService;