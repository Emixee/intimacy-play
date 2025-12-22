/**
 * Service de gestion des actions en jeu
 *
 * PROMPT 4.3 : Actions en jeu
 * 
 * Fonctionnalités :
 * - completeChallenge : Valider un défi
 * - changeChallenge : Changer un défi (avec limites)
 * - watchAdForChange : Obtenir un changement bonus via pub
 * - requestPartnerChallenge : Demander un défi au partenaire (Premium)
 * - submitPartnerChallenge : Soumettre un défi personnalisé (Premium)
 * - endSession : Terminer la partie
 *
 * Ce service utilise session.service.ts pour les opérations de base
 * et ajoute la logique métier spécifique au jeu.
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  serverTimestamp,
  sessionsCollection,
} from "../config/firebase";
import {
  Session,
  SessionChallenge,
  PlayerRole,
  IntensityLevel,
  ChallengeType,
  ApiResponse,
  MAX_CHALLENGE_CHANGES,
  MAX_BONUS_CHANGES,
} from "../types";
import { sessionService } from "./session.service";
import {
  getAlternatives,
  SelectionConfig,
  ChallengeAlternatives,
} from "../utils/challengeSelector";

// ============================================================
// TYPES SPÉCIFIQUES AU JEU
// ============================================================

/**
 * Défi en attente créé par le partenaire (Premium)
 */
export interface PendingPartnerChallenge {
  /** Texte du défi proposé */
  text: string;
  /** Niveau d'intensité */
  level: IntensityLevel;
  /** Type de média requis */
  type: ChallengeType;
  /** ID du partenaire qui a créé le défi */
  createdBy: string;
  /** Rôle du joueur qui doit faire ce défi */
  forPlayer: PlayerRole;
  /** Date de création */
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

/**
 * Résultat du changement de défi
 */
export interface ChangeChallengeResult {
  /** Les 2 alternatives proposées */
  alternatives: SessionChallenge[];
  /** Nombre de changements restants */
  remainingChanges: number;
  /** Nombre total de changements autorisés */
  totalChanges: number;
  /** Si illimité (Premium) */
  isUnlimited: boolean;
}

/**
 * Résultat de la complétion d'un défi
 */
export interface CompleteChallengeResult {
  /** Prochain défi (null si fin de partie) */
  nextChallenge: SessionChallenge | null;
  /** Index du prochain défi */
  nextIndex: number;
  /** La partie est-elle terminée ? */
  isGameOver: boolean;
  /** Progression en pourcentage */
  progress: number;
}

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

const GAME_ERROR_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: "Session introuvable",
  SESSION_NOT_ACTIVE: "La session n'est pas active",
  NOT_SESSION_MEMBER: "Vous n'êtes pas membre de cette session",
  NOT_YOUR_TURN: "Ce n'est pas votre tour",
  CHALLENGE_ALREADY_COMPLETED: "Ce défi a déjà été accompli",
  NO_CHANGES_LEFT: "Vous n'avez plus de changements disponibles",
  MAX_BONUS_REACHED: "Vous avez atteint le maximum de bonus (3)",
  PREMIUM_REQUIRED: "Cette fonctionnalité nécessite Premium",
  BOTH_PREMIUM_REQUIRED: "Les deux joueurs doivent être Premium",
  PENDING_CHALLENGE_EXISTS: "Un défi partenaire est déjà en attente",
  NO_PENDING_CHALLENGE: "Aucun défi partenaire en attente",
  INVALID_CHALLENGE_TEXT: "Le texte du défi est invalide",
  UNKNOWN_ERROR: "Une erreur est survenue",
};

const getErrorMessage = (key: string): string => {
  return GAME_ERROR_MESSAGES[key] || GAME_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalise un code de session
 */
const normalizeCode = (code: string): string => {
  return code.replace(/\s/g, "").toUpperCase();
};

/**
 * Récupère le rôle d'un utilisateur dans une session
 */
const getUserRole = (
  session: Session | Omit<Session, "id">,
  userId: string
): PlayerRole | null => {
  if (session.creatorId === userId) return "creator";
  if (session.partnerId === userId) return "partner";
  return null;
};

/**
 * Calcule les changements restants
 */
const calculateRemainingChanges = (
  session: Session | Omit<Session, "id">,
  userRole: PlayerRole,
  isPremium: boolean
): { remaining: number; total: number; isUnlimited: boolean } => {
  if (isPremium) {
    return { remaining: Infinity, total: Infinity, isUnlimited: true };
  }

  const changesUsed =
    userRole === "creator"
      ? session.creatorChangesUsed
      : session.partnerChangesUsed;
  const bonusChanges =
    userRole === "creator"
      ? session.creatorBonusChanges
      : session.partnerBonusChanges;

  const total = MAX_CHALLENGE_CHANGES + bonusChanges;
  const remaining = Math.max(0, total - changesUsed);

  return { remaining, total, isUnlimited: false };
};

// ============================================================
// SERVICE DE JEU
// ============================================================

export const gameService = {
  // ============================================================
  // COMPLETE CHALLENGE
  // ============================================================

  /**
   * Complète le défi actuel
   * 
   * - Marque le défi comme complété
   * - Passe au joueur suivant
   * - Vérifie si fin de partie
   */
  completeChallenge: async (
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse<CompleteChallengeResult>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      // Vérifier que la session est active
      if (session.status !== "active") {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_ACTIVE"),
        };
      }

      // Vérifier le rôle de l'utilisateur
      const userRole = getUserRole(session, userId);
      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      const currentIndex = session.currentChallengeIndex;
      const currentChallenge = session.challenges[currentIndex];

      // Vérifier que le défi n'est pas déjà complété
      if (currentChallenge.completed) {
        return {
          success: false,
          error: getErrorMessage("CHALLENGE_ALREADY_COMPLETED"),
        };
      }

      // Le validateur est l'OPPOSÉ de celui qui fait le défi
      const expectedValidator: PlayerRole =
        currentChallenge.forPlayer === "creator" ? "partner" : "creator";

      if (userRole !== expectedValidator) {
        return {
          success: false,
          error: getErrorMessage("NOT_YOUR_TURN"),
        };
      }

      // Mettre à jour le défi comme complété
      const updatedChallenges = [...session.challenges];
      updatedChallenges[currentIndex] = {
        ...currentChallenge,
        completed: true,
        completedBy: userId,
        completedAt: firestore.Timestamp.now(),
      };

      const nextIndex = currentIndex + 1;
      const isGameOver = nextIndex >= session.challengeCount;
      const nextChallenge = isGameOver ? null : updatedChallenges[nextIndex];
      const nextPlayer: PlayerRole = nextChallenge
        ? nextChallenge.forPlayer
        : "creator";

      // Préparer la mise à jour
      const updateData: Partial<Session> = {
        challenges: updatedChallenges,
        currentChallengeIndex: nextIndex,
        currentPlayer: nextPlayer,
      };

      if (isGameOver) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp() as any;
      }

      await sessionRef.update(updateData);

      // Calculer la progression
      const completedCount = updatedChallenges.filter((c) => c.completed).length;
      const progress = Math.round((completedCount / session.challengeCount) * 100);

      console.log(
        `[GameService] Challenge ${currentIndex} completed by ${userRole}. Progress: ${progress}%`
      );

      return {
        success: true,
        data: {
          nextChallenge,
          nextIndex,
          isGameOver,
          progress,
        },
      };
    } catch (error: any) {
      console.error("[GameService] completeChallenge error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  // ============================================================
  // CHANGE CHALLENGE
  // ============================================================

  /**
   * Change le défi actuel
   * 
   * - Vérifie la limite (3 gratuits, illimité premium)
   * - Vérifie les bonus via pub si gratuit
   * - Retourne 2 alternatives
   * - Incrémente le compteur si une alternative est choisie
   */
  changeChallenge: async (
    sessionCode: string,
    userId: string,
    isPremium: boolean
  ): Promise<ApiResponse<ChangeChallengeResult>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      } as Session;

      // Vérifier que la session est active
      if (session.status !== "active") {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_ACTIVE"),
        };
      }

      // Vérifier le rôle
      const userRole = getUserRole(session, userId);
      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Calculer les changements restants
      const { remaining, total, isUnlimited } = calculateRemainingChanges(
        session,
        userRole,
        isPremium
      );

      // Vérifier s'il reste des changements
      if (!isUnlimited && remaining <= 0) {
        return {
          success: false,
          error: getErrorMessage("NO_CHANGES_LEFT"),
        };
      }

      // Générer les alternatives
      const config: SelectionConfig = {
        creatorGender: session.creatorGender,
        partnerGender: session.partnerGender || session.creatorGender,
        count: session.challengeCount,
        startIntensity: session.startIntensity,
        isPremium,
        selectedThemes: [],
        includeToys: false,
        availableToys: [],
        mediaPreferences: {
          photo: true,
          audio: true,
          video: true,
        },
      };

      const alternativesResult = getAlternatives(
        session.challenges,
        session.currentChallengeIndex,
        config
      );

      console.log(
        `[GameService] Alternatives generated for ${userRole}. Remaining: ${remaining}/${total}`
      );

      return {
        success: true,
        data: {
          alternatives: alternativesResult.alternatives,
          remainingChanges: isUnlimited ? Infinity : remaining,
          totalChanges: total,
          isUnlimited,
        },
      };
    } catch (error: any) {
      console.error("[GameService] changeChallenge error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Confirme le changement de défi avec une alternative choisie
   * Incrémente le compteur de changements
   */
  confirmChallengeChange: async (
    sessionCode: string,
    userId: string,
    newChallenge: SessionChallenge,
    isPremium: boolean
  ): Promise<ApiResponse> => {
    return sessionService.swapChallenge(
      sessionCode,
      // On doit récupérer l'index actuel
      await gameService.getCurrentChallengeIndex(sessionCode),
      newChallenge,
      userId,
      isPremium
    );
  },

  /**
   * Récupère l'index du défi actuel
   */
  getCurrentChallengeIndex: async (sessionCode: string): Promise<number> => {
    const result = await sessionService.getSession(sessionCode);
    if (result.success && result.data) {
      return result.data.currentChallengeIndex;
    }
    return 0;
  },

  // ============================================================
  // WATCH AD FOR CHANGE
  // ============================================================

  /**
   * Ajoute un changement bonus via pub rewarded
   * 
   * - Vérifie max 3 bonus par partie
   * - Incrémente changesFromAds (bonusChanges)
   */
  watchAdForChange: async (
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse<{ newBonusTotal: number; maxBonus: number }>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;
      const userRole = getUserRole(session, userId);

      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Vérifier le maximum de bonus
      const currentBonus =
        userRole === "creator"
          ? session.creatorBonusChanges
          : session.partnerBonusChanges;

      if (currentBonus >= MAX_BONUS_CHANGES) {
        return {
          success: false,
          error: getErrorMessage("MAX_BONUS_REACHED"),
        };
      }

      // Incrémenter le bonus
      const newBonus = currentBonus + 1;
      const updateData: Partial<Session> = {};

      if (userRole === "creator") {
        updateData.creatorBonusChanges = newBonus;
      } else {
        updateData.partnerBonusChanges = newBonus;
      }

      await sessionsCollection().doc(normalizedCode).update(updateData);

      console.log(
        `[GameService] Bonus added for ${userRole}. New total: ${newBonus}/${MAX_BONUS_CHANGES}`
      );

      return {
        success: true,
        data: {
          newBonusTotal: newBonus,
          maxBonus: MAX_BONUS_CHANGES,
        },
      };
    } catch (error: any) {
      console.error("[GameService] watchAdForChange error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  // ============================================================
  // PARTNER CHALLENGE (Premium)
  // ============================================================

  /**
   * Demande un défi au partenaire (Premium uniquement)
   * 
   * - Vérifie que les 2 joueurs sont Premium
   * - Crée un pendingPartnerChallenge
   */
  requestPartnerChallenge: async (
    sessionCode: string,
    userId: string,
    isUserPremium: boolean,
    isPartnerPremium: boolean
  ): Promise<ApiResponse> => {
    // Vérifier que les deux sont premium
    if (!isUserPremium || !isPartnerPremium) {
      return {
        success: false,
        error: getErrorMessage("BOTH_PREMIUM_REQUIRED"),
      };
    }

    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as any;
      const userRole = getUserRole(session, userId);

      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Vérifier qu'il n'y a pas déjà un défi en attente
      if (session.pendingPartnerChallenge) {
        return {
          success: false,
          error: getErrorMessage("PENDING_CHALLENGE_EXISTS"),
        };
      }

      // Créer le placeholder pour le défi partenaire
      // Le partenaire devra le remplir avec submitPartnerChallenge
      const pendingChallenge: Partial<PendingPartnerChallenge> = {
        createdBy: userId,
        forPlayer: userRole === "creator" ? "partner" : "creator", // Le demandeur fera le défi
        createdAt: firestore.Timestamp.now(),
      };

      await sessionRef.update({
        pendingPartnerChallenge: pendingChallenge,
      });

      console.log(
        `[GameService] Partner challenge requested by ${userRole} in session ${sessionCode}`
      );

      return { success: true };
    } catch (error: any) {
      console.error("[GameService] requestPartnerChallenge error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Soumet un défi personnalisé créé par le partenaire (Premium)
   * 
   * - Remplace le défi actuel par le texte du partenaire
   * - Marque createdByPartner = true
   */
  submitPartnerChallenge: async (
    sessionCode: string,
    userId: string,
    challengeText: string,
    level: IntensityLevel = 2,
    type: ChallengeType = "texte"
  ): Promise<ApiResponse> => {
    // Validation du texte
    if (!challengeText || challengeText.trim().length < 10) {
      return {
        success: false,
        error: getErrorMessage("INVALID_CHALLENGE_TEXT"),
      };
    }

    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as any;
      const userRole = getUserRole(session, userId);

      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Vérifier qu'il y a un défi en attente
      if (!session.pendingPartnerChallenge) {
        return {
          success: false,
          error: getErrorMessage("NO_PENDING_CHALLENGE"),
        };
      }

      const pending = session.pendingPartnerChallenge as PendingPartnerChallenge;

      // Vérifier que c'est bien le bon partenaire qui soumet
      // Le créateur du pending n'est PAS celui qui soumet
      if (pending.createdBy === userId) {
        return {
          success: false,
          error: "Vous ne pouvez pas soumettre votre propre demande",
        };
      }

      // Créer le nouveau défi personnalisé
      const currentIndex = session.currentChallengeIndex;
      const currentChallenge = session.challenges[currentIndex];

      const partnerChallenge: SessionChallenge & { createdByPartner: boolean } = {
        text: challengeText.trim(),
        level,
        type,
        forGender: currentChallenge.forGender,
        forPlayer: pending.forPlayer,
        completed: false,
        completedBy: null,
        completedAt: null,
        createdByPartner: true,
      };

      // Remplacer le défi actuel
      const updatedChallenges = [...session.challenges];
      updatedChallenges[currentIndex] = partnerChallenge;

      await sessionRef.update({
        challenges: updatedChallenges,
        pendingPartnerChallenge: null, // Supprimer le pending
      });

      console.log(
        `[GameService] Partner challenge submitted by ${userRole} in session ${sessionCode}`
      );

      return { success: true };
    } catch (error: any) {
      console.error("[GameService] submitPartnerChallenge error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Annule une demande de défi partenaire
   */
  cancelPartnerChallengeRequest: async (
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as any;
      const userRole = getUserRole(session, userId);

      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      if (!session.pendingPartnerChallenge) {
        return {
          success: false,
          error: getErrorMessage("NO_PENDING_CHALLENGE"),
        };
      }

      // Seul le créateur de la demande peut l'annuler
      if (session.pendingPartnerChallenge.createdBy !== userId) {
        return {
          success: false,
          error: "Seul le demandeur peut annuler",
        };
      }

      await sessionRef.update({
        pendingPartnerChallenge: null,
      });

      return { success: true };
    } catch (error: any) {
      console.error("[GameService] cancelPartnerChallengeRequest error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  // ============================================================
  // END SESSION
  // ============================================================

  /**
   * Termine la session
   * 
   * - Marque status = completed
   * - Note : Le cleanup des médias sera géré par une Cloud Function
   */
  endSession: async (
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;
      const userRole = getUserRole(session, userId);

      if (!userRole) {
        return {
          success: false,
          error: getErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Marquer comme terminée
      await sessionRef.update({
        status: "completed",
        completedAt: serverTimestamp(),
      });

      console.log(`[GameService] Session ${sessionCode} ended by ${userRole}`);

      // NOTE: Le cleanup des médias sera déclenché par une Cloud Function
      // qui écoute les changements de status sur les sessions
      // Trigger: onUpdate -> if status changed to 'completed' -> cleanup media

      return { success: true };
    } catch (error: any) {
      console.error("[GameService] endSession error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Abandonne la session (l'un des joueurs quitte)
   */
  abandonSession: async (
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse> => {
    return sessionService.abandonSession(sessionCode, userId);
  },

  // ============================================================
  // HELPERS EXPOSÉS
  // ============================================================

  /**
   * Vérifie si un utilisateur peut changer de défi
   */
  canChangeChallenge: (
    session: Session,
    userId: string,
    isPremium: boolean
  ): { canChange: boolean; remaining: number; reason?: string } => {
    const userRole = getUserRole(session, userId);
    if (!userRole) {
      return { canChange: false, remaining: 0, reason: "Not a member" };
    }

    const { remaining, isUnlimited } = calculateRemainingChanges(
      session,
      userRole,
      isPremium
    );

    if (isUnlimited) {
      return { canChange: true, remaining: Infinity };
    }

    if (remaining <= 0) {
      return { canChange: false, remaining: 0, reason: "No changes left" };
    }

    return { canChange: true, remaining };
  },

  /**
   * Vérifie si un utilisateur peut obtenir un bonus via pub
   */
  canWatchAdForBonus: (
    session: Session,
    userId: string
  ): { canWatch: boolean; currentBonus: number; maxBonus: number } => {
    const userRole = getUserRole(session, userId);
    if (!userRole) {
      return { canWatch: false, currentBonus: 0, maxBonus: MAX_BONUS_CHANGES };
    }

    const currentBonus =
      userRole === "creator"
        ? session.creatorBonusChanges
        : session.partnerBonusChanges;

    return {
      canWatch: currentBonus < MAX_BONUS_CHANGES,
      currentBonus,
      maxBonus: MAX_BONUS_CHANGES,
    };
  },

  /**
   * Récupère les statistiques de la partie
   */
  getGameStats: (session: Session): {
    completed: number;
    total: number;
    progress: number;
    byLevel: Record<IntensityLevel, { completed: number; total: number }>;
  } => {
    const challenges = session.challenges;
    const completed = challenges.filter((c) => c.completed).length;
    const total = session.challengeCount;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byLevel: Record<IntensityLevel, { completed: number; total: number }> = {
      1: { completed: 0, total: 0 },
      2: { completed: 0, total: 0 },
      3: { completed: 0, total: 0 },
      4: { completed: 0, total: 0 },
    };

    for (const challenge of challenges) {
      byLevel[challenge.level].total++;
      if (challenge.completed) {
        byLevel[challenge.level].completed++;
      }
    }

    return { completed, total, progress, byLevel };
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default gameService;