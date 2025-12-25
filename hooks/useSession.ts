/**
 * Hook de gestion de session de jeu en temps réel
 *
 * Gère automatiquement :
 * - L'écoute des changements de session Firestore
 * - Le state de la session (session, loading, error)
 * - Les computed values (isMyTurn, isChallengeForMe, currentChallenge, progress)
 * - Les actions (completeChallenge, skipChallenge, abandonSession)
 *
 * LOGIQUE DE VALIDATION (FIX BUG couples même genre) :
 * - isChallengeForMe : Basé sur forPlayer (rôle) et NON sur forGender
 * - isMyTurn : C'est mon tour de VALIDER = le défi n'est PAS pour moi
 * 
 * PROMPT PARTNER-CHALLENGE :
 * - Ajout pendingPartnerChallenge pour les demandes de défis partenaires
 * - Ajout partnerIsPremium pour vérifier si les 2 joueurs sont premium
 */

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useGameStore } from "../stores/gameStore";
import { sessionService } from "../services/session.service";
import {
  Session,
  SessionChallenge,
  PlayerRole,
  PendingPartnerChallenge,
  ApiResponse,
  MAX_CHALLENGE_CHANGES,
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
  isChallengeForMe: boolean;
  myRole: PlayerRole | null;
  currentChallenge: SessionChallenge | null;
  progress: number;
  completedCount: number;
  changesRemaining: number;
  isSessionActive: boolean;
  isSessionCompleted: boolean;
  isSessionAbandoned: boolean;

  // PROMPT PARTNER-CHALLENGE : Nouvelles propriétés
  pendingPartnerChallenge: PendingPartnerChallenge | null;
  partnerIsPremium: boolean;
  isPartnerChallengeRequestedByMe: boolean;
  isPartnerChallengeForMeToCreate: boolean;

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
  
  // PROMPT PARTNER-CHALLENGE : État premium du partenaire
  const [partnerIsPremium, setPartnerIsPremium] = useState<boolean>(false);

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

        // PROMPT PARTNER-CHALLENGE : Le statut premium du partenaire
        // NOTE: On ne peut pas lire le document du partenaire (règles Firestore)
        // La vérification se fait côté game.service.ts via une Cloud Function
        // ou en stockant isPremium dans la session lors du join
        // Pour l'instant, on laisse partnerIsPremium à false
        // La vraie vérification se fera au moment de la demande
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
   * Est-ce que le défi actuel est pour MOI ?
   * 
   * FIX BUG COUPLES MÊME GENRE :
   * Utilise forPlayer (rôle) au lieu de forGender (genre)
   * Cela fonctionne pour tous les types de couples !
   */
  const isChallengeForMe = useMemo((): boolean => {
    if (!currentSession || !myRole || !currentChallenge) return false;

    // FIX: Utiliser forPlayer au lieu de comparer forGender avec mon genre
    // forPlayer indique quel RÔLE doit faire ce défi
    return currentChallenge.forPlayer === myRole;
  }, [currentSession, myRole, currentChallenge]);

  /**
   * Est-ce mon tour de VALIDER ?
   * Le validateur est l'OPPOSÉ de celui qui fait le défi
   */
  const isMyTurn = useMemo((): boolean => {
    if (!currentSession || !myRole) return false;
    if (currentSession.status !== "active") return false;
    if (!currentChallenge) return false;

    // Si le défi est pour moi, c'est le partenaire qui valide
    // Si le défi est pour le partenaire, c'est moi qui valide
    // Donc: isMyTurn = !isChallengeForMe
    return !isChallengeForMe;
  }, [currentSession, myRole, currentChallenge, isChallengeForMe]);

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
   * Nombre de changements restants pour ce joueur
   */
  const changesRemaining = useMemo((): number => {
    if (!currentSession || !myRole) return 0;

    const changesUsed =
      myRole === "creator"
        ? currentSession.creatorChangesUsed || 0
        : currentSession.partnerChangesUsed || 0;

    const bonusChanges =
      myRole === "creator"
        ? currentSession.creatorBonusChanges || 0
        : currentSession.partnerBonusChanges || 0;

    return MAX_CHALLENGE_CHANGES + bonusChanges - changesUsed;
  }, [currentSession, myRole]);

  /**
   * État de la session
   */
  const isSessionActive = currentSession?.status === "active";
  const isSessionCompleted = currentSession?.status === "completed";
  const isSessionAbandoned = currentSession?.status === "abandoned";

  // ----------------------------------------------------------
  // PROMPT PARTNER-CHALLENGE : Nouvelles computed values
  // ----------------------------------------------------------

  /**
   * Défi partenaire en attente
   */
  const pendingPartnerChallenge = useMemo((): PendingPartnerChallenge | null => {
    return currentSession?.pendingPartnerChallenge || null;
  }, [currentSession]);

  /**
   * Est-ce que la demande de défi partenaire a été faite par MOI ?
   * Note: createdBy = ID du demandeur
   */
  const isPartnerChallengeRequestedByMe = useMemo((): boolean => {
    if (!pendingPartnerChallenge || !userId) return false;
    return pendingPartnerChallenge.createdBy === userId;
  }, [pendingPartnerChallenge, userId]);

  /**
   * Est-ce que c'est à MOI de créer le défi partenaire ?
   * (Le partenaire qui n'a PAS fait la demande doit créer)
   */
  const isPartnerChallengeForMeToCreate = useMemo((): boolean => {
    if (!pendingPartnerChallenge || !userId) return false;
    return pendingPartnerChallenge.createdBy !== userId;
  }, [pendingPartnerChallenge, userId]);

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  /**
   * Compléter le défi actuel (validation par le partenaire)
   */
  const completeChallenge = useCallback(async (): Promise<ApiResponse<SessionChallenge | null>> => {
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
        error: "Ce n'est pas votre tour de valider",
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

      if (changesRemaining <= 0) {
        return {
          success: false,
          error: "Vous n'avez plus de changements disponibles",
        };
      }

      console.log(
        "[useSession] Skipping challenge:",
        currentSession.currentChallengeIndex
      );

      const result = await sessionService.swapChallenge(
        sessionCode,
        currentSession.currentChallengeIndex,
        newChallenge,
        userId || ""
      );

      if (!result.success) {
        setError(result.error || "Erreur lors du changement de défi");
      }

      return result;
    },
    [sessionCode, currentSession, changesRemaining, userId]
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
    setPartnerIsPremium(false);

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
    isChallengeForMe,
    myRole,
    currentChallenge,
    progress,
    completedCount,
    changesRemaining,
    isSessionActive,
    isSessionCompleted,
    isSessionAbandoned,

    // PROMPT PARTNER-CHALLENGE : Nouvelles propriétés
    pendingPartnerChallenge,
    partnerIsPremium,
    isPartnerChallengeRequestedByMe,
    isPartnerChallengeForMeToCreate,

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