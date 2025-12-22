/**
 * Store Zustand pour la gestion des sessions de jeu
 * 
 * PROMPT 4.2 : Store complet avec :
 * - session, currentChallenge, isMyTurn, loading, error
 * - sessionCode
 * - Actions complètes (subscribe, complete, swap, etc.)
 * 
 * Remplace/améliore gameStore.ts
 */

import { create } from "zustand";
import {
  Session,
  SessionChallenge,
  IntensityLevel,
  PlayerRole,
} from "../types";
import { sessionService } from "../services/session.service";
import { LIMITS } from "../utils/constants";
import { ChallengeAlternatives } from "../utils/challengeSelector";

// ============================================================
// TYPES
// ============================================================

interface SessionState {
  // ==================== STATE ====================
  /** Session courante */
  session: Session | null;
  /** Code de la session */
  sessionCode: string | null;
  /** L'utilisateur est le créateur */
  isCreator: boolean;
  /** La partie est active */
  isGameActive: boolean;
  /** Chargement en cours */
  loading: boolean;
  /** Message d'erreur */
  error: string | null;

  // Configuration de création
  challengeCount: number;
  startIntensity: IntensityLevel;

  // Alternatives pour changement de défi
  alternatives: ChallengeAlternatives | null;
  showAlternatives: boolean;

  // Unsubscribe function pour le listener Firebase
  _unsubscribe: (() => void) | null;

  // ==================== ACTIONS ====================
  /** Met à jour la session */
  setSession: (session: Session | null) => void;
  /** Met à jour le code de session */
  setSessionCode: (code: string | null) => void;
  /** Met à jour le nombre de défis */
  setChallengeCount: (count: number) => void;
  /** Met à jour l'intensité de départ */
  setStartIntensity: (intensity: IntensityLevel) => void;
  /** Réinitialise la configuration */
  resetConfiguration: () => void;
  /** Met à jour isCreator */
  setIsCreator: (isCreator: boolean) => void;
  /** Met à jour isGameActive */
  setIsGameActive: (isActive: boolean) => void;
  /** Met à jour loading */
  setLoading: (loading: boolean) => void;
  /** Met à jour error */
  setError: (error: string | null) => void;
  /** Nettoie tout le state */
  clearSession: () => void;

  // Actions Firebase
  /** S'abonne aux mises à jour d'une session */
  subscribeToSession: (code: string) => void;
  /** Se désabonne des mises à jour */
  unsubscribeFromSession: () => void;
  /** Charge une session par son code */
  loadSession: (code: string) => Promise<boolean>;

  // Actions de jeu
  /** Récupère les alternatives pour changer un défi */
  fetchAlternatives: (challengeIndex: number, isPremium: boolean) => void;
  /** Affiche/masque le modal d'alternatives */
  setShowAlternatives: (show: boolean) => void;
  /** Échange un défi */
  swapChallenge: (
    challengeIndex: number,
    newChallenge: SessionChallenge,
    userId: string,
    isPremium: boolean
  ) => Promise<boolean>;
}

// ============================================================
// STORE
// ============================================================

export const useSessionStore = create<SessionState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  session: null,
  sessionCode: null,
  isCreator: false,
  isGameActive: false,
  loading: false,
  error: null,
  challengeCount: LIMITS.CHALLENGES.DEFAULT,
  startIntensity: LIMITS.INTENSITY.DEFAULT as IntensityLevel,
  alternatives: null,
  showAlternatives: false,
  _unsubscribe: null,

  // ==================== SETTERS ====================
  setSession: (session) => set({ session, error: null }),
  setSessionCode: (code) => set({ sessionCode: code }),
  setChallengeCount: (count) => set({ challengeCount: count }),
  setStartIntensity: (intensity) => set({ startIntensity: intensity }),
  setIsCreator: (isCreator) => set({ isCreator }),
  setIsGameActive: (isActive) => set({ isGameActive: isActive }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  resetConfiguration: () =>
    set({
      challengeCount: LIMITS.CHALLENGES.DEFAULT,
      startIntensity: LIMITS.INTENSITY.DEFAULT as IntensityLevel,
    }),

  clearSession: () => {
    // Unsubscribe si actif
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
    }

    set({
      session: null,
      sessionCode: null,
      isCreator: false,
      isGameActive: false,
      loading: false,
      error: null,
      alternatives: null,
      showAlternatives: false,
      _unsubscribe: null,
    });
  },

  // ==================== FIREBASE ACTIONS ====================

  subscribeToSession: (code: string) => {
    // Unsubscribe de l'ancienne session si existe
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
    }

    set({ loading: true, error: null, sessionCode: code });

    const unsubscribe = sessionService.subscribeToSession(
      code,
      (session) => {
        set({
          session,
          loading: false,
          isGameActive: session.status === "active",
        });
      },
      (error) => {
        set({ error, loading: false });
      }
    );

    set({ _unsubscribe: unsubscribe });
  },

  unsubscribeFromSession: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) {
      _unsubscribe();
      set({ _unsubscribe: null });
    }
  },

  loadSession: async (code: string): Promise<boolean> => {
    set({ loading: true, error: null });

    const result = await sessionService.getSession(code);

    if (result.success && result.data) {
      set({
        session: result.data,
        sessionCode: code,
        loading: false,
        isGameActive: result.data.status === "active",
      });
      return true;
    } else {
      set({
        error: result.error || "Erreur de chargement",
        loading: false,
      });
      return false;
    }
  },

  // ==================== GAME ACTIONS ====================

  fetchAlternatives: (challengeIndex: number, isPremium: boolean) => {
    const { session } = get();
    if (!session) return;

    const alternatives = sessionService.getChallengeAlternatives(
      session,
      challengeIndex,
      isPremium
    );

    set({ alternatives, showAlternatives: true });
  },

  setShowAlternatives: (show: boolean) => {
    set({ showAlternatives: show });
    if (!show) {
      set({ alternatives: null });
    }
  },

  swapChallenge: async (
    challengeIndex: number,
    newChallenge: SessionChallenge,
    userId: string,
    isPremium: boolean
  ): Promise<boolean> => {
    const { sessionCode } = get();
    if (!sessionCode) return false;

    set({ loading: true, error: null });

    const result = await sessionService.swapChallenge(
      sessionCode,
      challengeIndex,
      newChallenge,
      userId,
      isPremium
    );

    set({ loading: false, showAlternatives: false, alternatives: null });

    if (!result.success) {
      set({ error: result.error || "Erreur lors du changement" });
      return false;
    }

    return true;
  },
}));

// ============================================================
// SELECTORS
// ============================================================

/** Sélectionne la session courante */
export const selectSession = (state: SessionState) => state.session;

/** Sélectionne le code de session */
export const selectSessionCode = (state: SessionState) => state.sessionCode;

/** Sélectionne le nombre de défis configuré */
export const selectChallengeCount = (state: SessionState) => state.challengeCount;

/** Sélectionne l'intensité de départ configurée */
export const selectStartIntensity = (state: SessionState) => state.startIntensity;

/** Sélectionne si l'utilisateur est créateur */
export const selectIsCreator = (state: SessionState) => state.isCreator;

/** Sélectionne si la partie est active */
export const selectIsGameActive = (state: SessionState) => state.isGameActive;

/** Sélectionne l'état de chargement */
export const selectLoading = (state: SessionState) => state.loading;

/** Sélectionne l'erreur */
export const selectError = (state: SessionState) => state.error;

/** Sélectionne les alternatives */
export const selectAlternatives = (state: SessionState) => state.alternatives;

/** Sélectionne si le modal d'alternatives est visible */
export const selectShowAlternatives = (state: SessionState) => state.showAlternatives;

/**
 * Sélectionne le défi actuel
 */
export const selectCurrentChallenge = (state: SessionState): SessionChallenge | null => {
  const session = state.session;
  if (!session) return null;
  return session.challenges[session.currentChallengeIndex] || null;
};

/**
 * Sélectionne l'index du défi actuel
 */
export const selectCurrentChallengeIndex = (state: SessionState): number => {
  return state.session?.currentChallengeIndex ?? 0;
};

/**
 * Sélectionne la progression en pourcentage
 */
export const selectProgress = (state: SessionState): number => {
  const session = state.session;
  if (!session || session.challengeCount === 0) return 0;
  return Math.round((session.currentChallengeIndex / session.challengeCount) * 100);
};

/**
 * Sélectionne la progression détaillée
 */
export const selectProgressDetails = (state: SessionState): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const session = state.session;
  if (!session) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = session.challenges.filter((c) => c.completed).length;
  const total = session.challengeCount;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
};

/**
 * Sélectionne si c'est le tour de l'utilisateur
 */
export const selectIsMyTurn = (userId: string) => (state: SessionState): boolean => {
  const session = state.session;
  if (!session || session.status !== "active") return false;

  if (session.currentPlayer === "creator") {
    return session.creatorId === userId;
  }
  return session.partnerId === userId;
};

/**
 * Sélectionne le rôle de l'utilisateur
 */
export const selectUserRole = (userId: string) => (state: SessionState): PlayerRole | null => {
  const session = state.session;
  if (!session) return null;

  if (session.creatorId === userId) return "creator";
  if (session.partnerId === userId) return "partner";
  return null;
};

/**
 * Sélectionne les changements restants pour un joueur
 */
export const selectRemainingChanges = (userId: string, isPremium: boolean) => (state: SessionState): {
  remaining: number;
  total: number;
  isUnlimited: boolean;
} => {
  const session = state.session;
  if (!session) {
    return { remaining: 0, total: 0, isUnlimited: false };
  }

  const userRole = session.creatorId === userId ? "creator" : "partner";
  return sessionService.getRemainingChanges(session, userRole, isPremium);
};

/**
 * Sélectionne si le partenaire a rejoint
 */
export const selectPartnerJoined = (state: SessionState): boolean => {
  return state.session?.partnerId !== null;
};

/**
 * Sélectionne le statut de la session
 */
export const selectSessionStatus = (state: SessionState) => {
  return state.session?.status || null;
};

// ============================================================
// HOOKS DÉRIVÉS (à utiliser dans les composants)
// ============================================================

/**
 * Hook pour obtenir le défi actuel avec son index
 */
export const useCurrentChallenge = () => {
  return useSessionStore((state) => {
    const session = state.session;
    if (!session) return null;

    const index = session.currentChallengeIndex;
    const challenge = session.challenges[index];

    if (!challenge) return null;

    return { challenge, index };
  });
};

/**
 * Hook pour obtenir le rôle de l'utilisateur
 */
export const useUserRole = (userId: string): PlayerRole | null => {
  return useSessionStore(selectUserRole(userId));
};

/**
 * Hook pour savoir si c'est le tour de l'utilisateur
 */
export const useIsMyTurn = (userId: string): boolean => {
  return useSessionStore(selectIsMyTurn(userId));
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useSessionStore;