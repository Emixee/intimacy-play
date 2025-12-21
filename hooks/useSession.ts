/**
 * Hook de gestion de session de jeu en temps réel
 *
 * Gère automatiquement :
 * - L'écoute des changements de session Firestore
 * - Le state de la session (session, loading, error)
 * - Les computed values (isMyTurn, currentChallenge, progress)
 * - Les actions (completeChallenge, skipChallenge, abandonSession)
 *
 * Usage:
 * const {
 *   session,
 *   isLoading,
 *   error,
 *   isMyTurn,
 *   currentChallenge,
 *   progress,
 *   completeChallenge,
 *   skipChallenge,
 *   abandonSession,
 *   clearSession
 * } = useSession(sessionCode, userId);
 */

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useGameStore } from "../stores/gameStore";
import { sessionService } from "../services/session.service";
import {
  Session,
  SessionChallenge,
  PlayerRole,
  ApiResponse,
} from "../types";

// ============================================================
// INTERFACE DU HOOK
// ============================================================

interface UseSessionReturn {
  // State
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isSubscribed: boolean;

  // Computed values
  isMyTurn: boolean;
  myRole: PlayerRole | null;
  currentChallenge: SessionChallenge | null;
  progress: number;
  completedCount: number;
  isSessionActive: boolean;
  isSessionCompleted: boolean;
  isSessionAbandoned: boolean;

  // Actions
  completeChallenge: () => Promise<ApiResponse<SessionChallenge | null>>;
  skipChallenge: (newChallenge: SessionChallenge) => Promise<ApiResponse>;
  abandonSession: () => Promise<ApiResponse>;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
}

interface UseSessionParams {
  sessionCode: string | null;
  userId: string | null;
  autoSubscribe?: boolean;
}

// ============================================================
// HOOK
// ============================================================

export const useSession = ({
  sessionCode,
  userId,
  autoSubscribe = true,
}: UseSessionParams): UseSessionReturn => {
  // Store
  const {
    currentSession,
    setCurrentSession,
    setSessionCode,
    setIsCreator,
    setIsGameActive,
    clearGame,
  } = useGameStore();

  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Ref pour le cleanup du listener
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ----------------------------------------------------------
  // SUBSCRIPTION À LA SESSION
  // ----------------------------------------------------------

  useEffect(() => {
    // Pas de sessionCode ou userId = pas d'abonnement
    if (!sessionCode || !userId || !autoSubscribe) {
      setIsLoading(false);
      setIsSubscribed(false);
      return;
    }

    console.log("[useSession] Setting up session listener for:", sessionCode);
    setIsLoading(true);
    setError(null);

    // Cleanup du listener précédent
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // S'abonner aux changements de session
    const unsubscribe = sessionService.subscribeToSession(
      sessionCode,
      (session: Session) => {
        console.log("[useSession] Session updated:", session.id, session.status);

        // Mettre à jour le store
        setCurrentSession(session);
        setSessionCode(session.id);

        // Déterminer si l'utilisateur est le créateur
        const isCreator = session.creatorId === userId;
        setIsCreator(isCreator);

        // La session est active si le statut est "active"
        setIsGameActive(session.status === "active");

        setIsLoading(false);
        setError(null);
        setIsSubscribed(true);
      },
      (errorMessage: string) => {
        console.error("[useSession] Session listener error:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        setIsSubscribed(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup au démontage ou changement de sessionCode
    return () => {
      console.log("[useSession] Cleaning up session listener");
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [
    sessionCode,
    userId,
    autoSubscribe,
    setCurrentSession,
    setSessionCode,
    setIsCreator,
    setIsGameActive,
  ]);

  // ----------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------

  /**
   * Rôle de l'utilisateur dans la session
   */
  const myRole = useMemo((): PlayerRole | null => {
    if (!currentSession || !userId) return null;
    return sessionService.getUserRole(currentSession, userId);
  }, [currentSession, userId]);

  /**
   * Est-ce le tour de l'utilisateur ?
   */
  const isMyTurn = useMemo((): boolean => {
    if (!currentSession || !myRole) return false;
    if (currentSession.status !== "active") return false;
    return currentSession.currentPlayer === myRole;
  }, [currentSession, myRole]);

  /**
   * Défi actuel
   */
  const currentChallenge = useMemo((): SessionChallenge | null => {
    if (!currentSession) return null;
    if (currentSession.currentChallengeIndex >= currentSession.challenges.length) {
      return null;
    }
    return currentSession.challenges[currentSession.currentChallengeIndex] || null;
  }, [currentSession]);

  /**
   * Progression en pourcentage
   */
  const progress = useMemo((): number => {
    if (!currentSession) return 0;
    if (currentSession.challengeCount === 0) return 0;
    return Math.round(
      (currentSession.currentChallengeIndex / currentSession.challengeCount) * 100
    );
  }, [currentSession]);

  /**
   * Nombre de défis complétés
   */
  const completedCount = useMemo((): number => {
    if (!currentSession) return 0;
    return currentSession.challenges.filter((c) => c.completed).length;
  }, [currentSession]);

  /**
   * État de la session
   */
  const isSessionActive = currentSession?.status === "active";
  const isSessionCompleted = currentSession?.status === "completed";
  const isSessionAbandoned = currentSession?.status === "abandoned";

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  /**
   * Compléter le défi actuel
   */
  const completeChallenge = useCallback(async (): Promise
    ApiResponse<SessionChallenge | null>
  > => {
    if (!sessionCode || !userId) {
      return {
        success: false,
        error: "Session ou utilisateur non défini",
      };
    }

    if (!currentSession) {
      return {
        success: false,
        error: "Aucune session active",
      };
    }

    if (!isMyTurn) {
      return {
        success: false,
        error: "Ce n'est pas votre tour",
      };
    }

    console.log(
      "[useSession] Completing challenge:",
      currentSession.currentChallengeIndex
    );

    const result = await sessionService.completeChallenge(
      sessionCode,
      currentSession.currentChallengeIndex,
      userId
    );

    if (!result.success) {
      setError(result.error || "Erreur lors de la complétion du défi");
    }

    return result;
  }, [sessionCode, userId, currentSession, isMyTurn]);

  /**
   * Passer le défi actuel (échanger avec un autre)
   */
  const skipChallenge = useCallback(
    async (newChallenge: SessionChallenge): Promise<ApiResponse> => {
      if (!sessionCode) {
        return {
          success: false,
          error: "Session non définie",
        };
      }

      if (!currentSession) {
        return {
          success: false,
          error: "Aucune session active",
        };
      }

      console.log(
        "[useSession] Skipping challenge:",
        currentSession.currentChallengeIndex
      );

      const result = await sessionService.swapChallenge(
        sessionCode,
        currentSession.currentChallengeIndex,
        newChallenge
      );

      if (!result.success) {
        setError(result.error || "Erreur lors du changement de défi");
      }

      return result;
    },
    [sessionCode, currentSession]
  );

  /**
   * Abandonner la session
   */
  const abandonSession = useCallback(async (): Promise<ApiResponse> => {
    if (!sessionCode || !userId) {
      return {
        success: false,
        error: "Session ou utilisateur non défini",
      };
    }

    console.log("[useSession] Abandoning session:", sessionCode);

    const result = await sessionService.abandonSession(sessionCode, userId);

    if (!result.success) {
      setError(result.error || "Erreur lors de l'abandon de la session");
    }

    return result;
  }, [sessionCode, userId]);

  /**
   * Nettoyer la session (sans la supprimer de Firebase)
   */
  const clearSession = useCallback(() => {
    console.log("[useSession] Clearing local session state");

    // Cleanup du listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Reset du state local
    setError(null);
    setIsLoading(false);
    setIsSubscribed(false);

    // Reset du store
    clearGame();
  }, [clearGame]);

  /**
   * Rafraîchir les données de session manuellement
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!sessionCode) return;

    setIsLoading(true);
    const result = await sessionService.getSession(sessionCode);

    if (result.success && result.data) {
      setCurrentSession(result.data);
      setError(null);
    } else {
      setError(result.error || "Erreur lors du rafraîchissement");
    }

    setIsLoading(false);
  }, [sessionCode, setCurrentSession]);

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    // State
    session: currentSession,
    isLoading,
    error,
    isSubscribed,

    // Computed values
    isMyTurn,
    myRole,
    currentChallenge,
    progress,
    completedCount,
    isSessionActive,
    isSessionCompleted,
    isSessionAbandoned,

    // Actions
    completeChallenge,
    skipChallenge,
    abandonSession,
    clearSession,
    refreshSession,
  };
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useSession;