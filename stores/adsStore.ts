/**
 * Store Zustand pour la gestion des publicités
 *
 * Gère l'état des publicités côté client :
 * - Compteur de parties gratuites du jour
 * - Compteur de changements bonus par session
 * - États de chargement des pubs
 *
 * PROMPT 7.3 : Store Publicités
 */

import { create } from "zustand";
import { adsService, RewardedAdResult } from "../services/ads.service";
import { gameService } from "../services/game.service";
import { LIMITS } from "../utils/constants";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AdsState {
  // Compteurs
  /** Nombre de parties gratuites obtenues aujourd'hui via pub */
  freeGamesToday: number;
  /** Nombre de changements bonus obtenus cette session via pub */
  adChangesThisSession: number;
  /** Date du dernier comptage (YYYY-MM-DD) */
  lastFreeGameDate: string | null;

  // États de chargement
  /** Initialisation en cours */
  isInitializing: boolean;
  /** Affichage de pub en cours */
  isShowingAd: boolean;
  /** Pub interstitielle prête */
  interstitialReady: boolean;
  /** Pub rewarded prête */
  rewardedReady: boolean;

  // Erreurs
  error: string | null;

  // Actions
  initAds: () => Promise<void>;
  showInterstitial: (isPremium: boolean) => Promise<boolean>;
  showRewardedForGame: () => Promise<RewardedAdResult | null>;
  showRewardedForChange: (
    sessionCode: string,
    userId: string
  ) => Promise<RewardedAdResult | null>;
  resetSessionChanges: () => void;
  loadFreeGamesCount: () => Promise<void>;
  clearError: () => void;
}

// ============================================================
// CONSTANTES
// ============================================================

/** Maximum de parties gratuites par jour via pubs */
const MAX_FREE_GAMES_FROM_ADS = LIMITS.FREE_GAMES_PER_DAY; // 3

/** Maximum de changements bonus par session via pubs */
const MAX_AD_CHANGES_PER_SESSION = LIMITS.CHANGES.BONUS_FROM_ADS; // 3

// ============================================================
// ÉTAT INITIAL
// ============================================================

const INITIAL_STATE = {
  freeGamesToday: 0,
  adChangesThisSession: 0,
  lastFreeGameDate: null,
  isInitializing: false,
  isShowingAd: false,
  interstitialReady: false,
  rewardedReady: false,
  error: null,
};

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useAdsStore = create<AdsState>((set, get) => ({
  ...INITIAL_STATE,

  // ----------------------------------------------------------
  // INITIALISATION
  // ----------------------------------------------------------

  initAds: async () => {
    const { isInitializing } = get();
    if (isInitializing) return;

    set({ isInitializing: true, error: null });

    try {
      const result = await adsService.initAds();

      if (result.success) {
        set({
          isInitializing: false,
          interstitialReady: adsService.isInterstitialReady(),
          rewardedReady: adsService.isRewardedReady(),
        });

        // Charger le compteur de parties gratuites
        await get().loadFreeGamesCount();
      } else {
        set({
          isInitializing: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      console.error("[AdsStore] initAds error:", error);
      set({
        isInitializing: false,
        error: "Erreur d'initialisation des publicités",
      });
    }
  },

  // ----------------------------------------------------------
  // INTERSTITIAL (Début de partie gratuit)
  // ----------------------------------------------------------

  /**
   * Affiche une pub interstitielle au début de partie
   *
   * @param isPremium - Si l'utilisateur est premium (pas de pub)
   * @returns true si la pub a été affichée
   */
  showInterstitial: async (isPremium: boolean): Promise<boolean> => {
    // Pas de pub pour les premium
    if (isPremium) {
      return false;
    }

    set({ isShowingAd: true, error: null });

    try {
      const result = await adsService.showInterstitial(isPremium);

      set({
        isShowingAd: false,
        interstitialReady: adsService.isInterstitialReady(),
      });

      return result.success && result.data?.shown === true;
    } catch (error: any) {
      console.error("[AdsStore] showInterstitial error:", error);
      set({
        isShowingAd: false,
        error: "Erreur lors de l'affichage de la publicité",
      });
      return false;
    }
  },

  // ----------------------------------------------------------
  // REWARDED FOR GAME (+1 partie gratuite)
  // ----------------------------------------------------------

  /**
   * Affiche une pub rewarded pour obtenir une partie gratuite
   *
   * @returns RewardedAdResult si réussi, null sinon
   */
  showRewardedForGame: async (): Promise<RewardedAdResult | null> => {
    const { freeGamesToday, isShowingAd } = get();

    // Vérifier si pas déjà en cours
    if (isShowingAd) {
      return null;
    }

    // Vérifier la limite quotidienne
    if (freeGamesToday >= MAX_FREE_GAMES_FROM_ADS) {
      set({ error: `Maximum ${MAX_FREE_GAMES_FROM_ADS} parties gratuites par jour atteint` });
      return null;
    }

    set({ isShowingAd: true, error: null });

    try {
      const result = await adsService.showRewardedForGame(freeGamesToday);

      if (result.success && result.data?.rewarded) {
        // Incrémenter le compteur
        const newCount = await adsService.incrementFreeGames();

        set({
          isShowingAd: false,
          freeGamesToday: newCount,
          rewardedReady: adsService.isRewardedReady(),
        });

        console.log(
          `[AdsStore] Free game earned! Total today: ${newCount}/${MAX_FREE_GAMES_FROM_ADS}`
        );

        return result.data;
      } else {
        set({
          isShowingAd: false,
          error: result.error || "La publicité n'a pas été regardée en entier",
        });
        return null;
      }
    } catch (error: any) {
      console.error("[AdsStore] showRewardedForGame error:", error);
      set({
        isShowingAd: false,
        error: "Erreur lors de l'affichage de la publicité",
      });
      return null;
    }
  },

  // ----------------------------------------------------------
  // REWARDED FOR CHANGE (+1 changement bonus)
  // ----------------------------------------------------------

  /**
   * Affiche une pub rewarded pour obtenir un changement bonus
   *
   * @param sessionCode - Code de la session
   * @param userId - ID de l'utilisateur
   * @returns RewardedAdResult si réussi, null sinon
   */
  showRewardedForChange: async (
    sessionCode: string,
    userId: string
  ): Promise<RewardedAdResult | null> => {
    const { adChangesThisSession, isShowingAd } = get();

    // Vérifier si pas déjà en cours
    if (isShowingAd) {
      return null;
    }

    // Vérifier la limite par session
    if (adChangesThisSession >= MAX_AD_CHANGES_PER_SESSION) {
      set({
        error: `Maximum ${MAX_AD_CHANGES_PER_SESSION} changements bonus par partie atteint`,
      });
      return null;
    }

    set({ isShowingAd: true, error: null });

    try {
      const result = await adsService.showRewardedForChange(adChangesThisSession);

      if (result.success && result.data?.rewarded) {
        // Ajouter le bonus dans la session via gameService
        const bonusResult = await gameService.watchAdForChange(sessionCode, userId);

        if (bonusResult.success) {
          const newCount = adChangesThisSession + 1;

          set({
            isShowingAd: false,
            adChangesThisSession: newCount,
            rewardedReady: adsService.isRewardedReady(),
          });

          console.log(
            `[AdsStore] Bonus change earned! Total session: ${newCount}/${MAX_AD_CHANGES_PER_SESSION}`
          );

          return result.data;
        } else {
          set({
            isShowingAd: false,
            error: bonusResult.error || "Erreur lors de l'ajout du bonus",
          });
          return null;
        }
      } else {
        set({
          isShowingAd: false,
          error: result.error || "La publicité n'a pas été regardée en entier",
        });
        return null;
      }
    } catch (error: any) {
      console.error("[AdsStore] showRewardedForChange error:", error);
      set({
        isShowingAd: false,
        error: "Erreur lors de l'affichage de la publicité",
      });
      return null;
    }
  },

  // ----------------------------------------------------------
  // RESET SESSION CHANGES
  // ----------------------------------------------------------

  /**
   * Réinitialise le compteur de changements bonus pour une nouvelle session
   * À appeler quand une nouvelle partie commence
   */
  resetSessionChanges: () => {
    set({ adChangesThisSession: 0 });
    console.log("[AdsStore] Session changes reset");
  },

  // ----------------------------------------------------------
  // LOAD FREE GAMES COUNT
  // ----------------------------------------------------------

  /**
   * Charge le compteur de parties gratuites depuis le storage
   */
  loadFreeGamesCount: async () => {
    try {
      const count = await adsService.getFreeGamesToday();
      set({
        freeGamesToday: count,
        lastFreeGameDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("[AdsStore] loadFreeGamesCount error:", error);
    }
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

/** Sélecteur pour le nombre de parties gratuites restantes */
export const selectRemainingFreeGames = (state: AdsState) =>
  MAX_FREE_GAMES_FROM_ADS - state.freeGamesToday;

/** Sélecteur pour le nombre de changements bonus restants */
export const selectRemainingAdChanges = (state: AdsState) =>
  MAX_AD_CHANGES_PER_SESSION - state.adChangesThisSession;

/** Sélecteur pour savoir si on peut regarder une pub pour une partie */
export const selectCanWatchAdForGame = (state: AdsState) =>
  state.freeGamesToday < MAX_FREE_GAMES_FROM_ADS && !state.isShowingAd;

/** Sélecteur pour savoir si on peut regarder une pub pour un changement */
export const selectCanWatchAdForChange = (state: AdsState) =>
  state.adChangesThisSession < MAX_AD_CHANGES_PER_SESSION && !state.isShowingAd;

/** Sélecteur pour l'affichage d'une pub en cours */
export const selectIsShowingAd = (state: AdsState) => state.isShowingAd;

/** Sélecteur pour l'erreur */
export const selectAdsError = (state: AdsState) => state.error;

// ============================================================
// HOOKS UTILITAIRES
// ============================================================

/**
 * Hook pour obtenir l'état des parties gratuites
 */
export const useFreeGamesStatus = () => {
  return useAdsStore((state) => ({
    used: state.freeGamesToday,
    remaining: MAX_FREE_GAMES_FROM_ADS - state.freeGamesToday,
    max: MAX_FREE_GAMES_FROM_ADS,
    canWatch: state.freeGamesToday < MAX_FREE_GAMES_FROM_ADS && !state.isShowingAd,
  }));
};

/**
 * Hook pour obtenir l'état des changements bonus
 */
export const useAdChangesStatus = () => {
  return useAdsStore((state) => ({
    used: state.adChangesThisSession,
    remaining: MAX_AD_CHANGES_PER_SESSION - state.adChangesThisSession,
    max: MAX_AD_CHANGES_PER_SESSION,
    canWatch:
      state.adChangesThisSession < MAX_AD_CHANGES_PER_SESSION && !state.isShowingAd,
  }));
};

/**
 * Hook pour savoir si les pubs sont prêtes
 */
export const useAdsReady = () => {
  return useAdsStore((state) => ({
    interstitial: state.interstitialReady,
    rewarded: state.rewardedReady,
    isInitializing: state.isInitializing,
  }));
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useAdsStore;