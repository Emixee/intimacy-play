/**
 * Service de gestion des sessions de jeu
 *
 * Gère toutes les opérations liées aux sessions :
 * - Génération de codes uniques
 * - Création/suppression de sessions
 * - Rejoindre une session
 * - Synchronisation temps réel
 * - Progression des défis
 * 
 * FIX BUG COUPLES MÊME GENRE :
 * La validation utilise maintenant forPlayer (rôle) au lieu de forGender
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  serverTimestamp,
  sessionsCollection,
} from "../config/firebase";
import {
  Session,
  SessionStatus,
  SessionChallenge,
  Gender,
  IntensityLevel,
  PlayerRole,
  CreateSessionData,
  ApiResponse,
} from "../types";

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const SESSION_ERROR_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: "Session introuvable",
  SESSION_FULL: "Cette session est déjà complète",
  SESSION_EXPIRED: "Cette session a expiré",
  SESSION_ALREADY_STARTED: "Cette session a déjà commencé",
  SESSION_ABANDONED: "Cette session a été abandonnée",
  SESSION_COMPLETED: "Cette session est terminée",
  NOT_SESSION_MEMBER: "Vous n'êtes pas membre de cette session",
  CANNOT_JOIN_OWN_SESSION: "Vous ne pouvez pas rejoindre votre propre session",
  ALREADY_IN_SESSION: "Vous êtes déjà dans cette session",
  CHALLENGE_NOT_FOUND: "Défi introuvable",
  CHALLENGE_ALREADY_COMPLETED: "Ce défi a déjà été accompli",
  NOT_YOUR_TURN: "Ce n'est pas votre tour de valider",
  NO_CHANGES_LEFT: "Vous n'avez plus de changements disponibles",
  UNKNOWN_ERROR: "Une erreur est survenue",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre réseau",
};

const getSessionErrorMessage = (errorKey: string): string => {
  return SESSION_ERROR_MESSAGES[errorKey] || SESSION_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// HELPERS (fonctions pures, pas de this)
// ============================================================

const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const SESSION_EXPIRATION_HOURS = 24;

/**
 * Génère un code de session de 6 caractères
 */
const generateCode = (): string => {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARACTERS.length);
    code += CODE_CHARACTERS[randomIndex];
  }
  return `${code.slice(0, 3)} ${code.slice(3)}`;
};

/**
 * Normalise un code (supprime espaces, majuscules)
 */
const normalizeCode = (code: string): string => {
  return code.replace(/\s/g, "").toUpperCase();
};

/**
 * Vérifie si une session est expirée
 */
const isSessionExpired = (createdAt: FirebaseFirestoreTypes.Timestamp): boolean => {
  const expirationTime = createdAt.toDate().getTime() + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000;
  return Date.now() > expirationTime;
};

/**
 * Vérifie si un code existe dans Firestore
 */
const checkCodeExists = async (normalizedCode: string): Promise<boolean> => {
  try {
    const doc = await sessionsCollection().doc(normalizedCode).get();
    // FIX: exists() est maintenant une méthode
    return doc.exists();
  } catch (error) {
    console.error("[SessionService] Error checking code:", error);
    return false;
  }
};

/**
 * Génère un code unique qui n'existe pas
 */
const generateUniqueSessionCode = async (): Promise<string> => {
  let code = generateCode();
  let normalizedCode = normalizeCode(code);
  let attempts = 0;
  const maxAttempts = 10;

  while (await checkCodeExists(normalizedCode) && attempts < maxAttempts) {
    code = generateCode();
    normalizedCode = normalizeCode(code);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Impossible de générer un code unique");
  }

  return code;
};

/**
 * Détermine le rôle d'un utilisateur
 */
const getUserRoleInSession = (session: Session | Omit<Session, "id">, odfsdfhdjsud: string): PlayerRole | null => {
  if (session.creatorId === odfsdfhdjsud) return "creator";
  if (session.partnerId === odfsdfhdjsud) return "partner";
  return null;
};

// ============================================================
// SERVICE DE SESSION
// ============================================================

export const sessionService = {
  // Expose les helpers si besoin
  generateSessionCode: generateCode,
  normalizeSessionCode: normalizeCode,

  /**
   * Vérifie si un code existe
   */
  isCodeTaken: async (code: string): Promise<boolean> => {
    const normalizedCode = normalizeCode(code);
    return checkCodeExists(normalizedCode);
  },

  /**
   * Génère un code unique
   */
  generateUniqueCode: generateUniqueSessionCode,

  /**
   * Crée une nouvelle session
   */
  createSession: async (
    creatorId: string,
    creatorGender: Gender,
    config: CreateSessionData,
    challenges: SessionChallenge[]
  ): Promise<ApiResponse<string>> => {
    try {
      const sessionCode = await generateUniqueSessionCode();
      const normalizedCode = normalizeCode(sessionCode);

      const sessionData: Omit<Session, "id"> = {
        creatorId,
        creatorGender,
        partnerId: null,
        partnerGender: null,
        status: "waiting",
        challengeCount: config.challengeCount,
        startIntensity: config.startIntensity,
        currentChallengeIndex: 0,
        currentPlayer: "creator",
        challenges,
        // Compteurs de changements
        creatorChangesUsed: 0,
        partnerChangesUsed: 0,
        creatorBonusChanges: 0,
        partnerBonusChanges: 0,
        // Timestamps
        createdAt: serverTimestamp() as any,
        startedAt: null,
        completedAt: null,
      };

      await sessionsCollection().doc(normalizedCode).set(sessionData);

      console.log(`[SessionService] Session created: ${sessionCode}`);

      return {
        success: true,
        data: sessionCode,
      };
    } catch (error: any) {
      console.error("[SessionService] Create session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Rejoindre une session
   */
  joinSession: async (
    sessionCode: string,
    partnerId: string,
    partnerGender: Gender
  ): Promise<ApiResponse<Session>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const sessionData = sessionDoc.data() as Omit<Session, "id">;

      if (sessionData.creatorId === partnerId) {
        return {
          success: false,
          error: getSessionErrorMessage("CANNOT_JOIN_OWN_SESSION"),
        };
      }

      if (sessionData.status !== "waiting") {
        const errorKey =
          sessionData.status === "active"
            ? "SESSION_ALREADY_STARTED"
            : sessionData.status === "abandoned"
            ? "SESSION_ABANDONED"
            : "SESSION_COMPLETED";
        return {
          success: false,
          error: getSessionErrorMessage(errorKey),
        };
      }

      if (sessionData.partnerId !== null) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_FULL"),
        };
      }

      if (isSessionExpired(sessionData.createdAt as FirebaseFirestoreTypes.Timestamp)) {
        await sessionRef.update({ status: "abandoned" });
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_EXPIRED"),
        };
      }

      await sessionRef.update({
        partnerId,
        partnerGender,
        status: "active",
        startedAt: serverTimestamp(),
      });

      const updatedDoc = await sessionRef.get();
      const updatedSession: Session = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Session;

      console.log(`[SessionService] Partner joined session: ${sessionCode}`);

      return {
        success: true,
        data: updatedSession,
      };
    } catch (error: any) {
      console.error("[SessionService] Join session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère une session
   */
  getSession: async (sessionCode: string): Promise<ApiResponse<Session>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session: Session = {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      } as Session;

      return {
        success: true,
        data: session,
      };
    } catch (error: any) {
      console.error("[SessionService] Get session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Vérifie si un utilisateur est membre
   */
  isSessionMember: (session: Session, odfsdfhdjsud: string): boolean => {
    return session.creatorId === odfsdfhdjsud || session.partnerId === odfsdfhdjsud;
  },

  /**
   * Récupère le rôle d'un utilisateur
   */
  getUserRole: (session: Session, odfsdfhdjsud: string): PlayerRole | null => {
    return getUserRoleInSession(session, odfsdfhdjsud);
  },

  /**
   * S'abonne aux changements d'une session
   */
  subscribeToSession: (
    sessionCode: string,
    onUpdate: (session: Session) => void,
    onError?: (error: string) => void
  ): (() => void) => {
    const normalizedCode = normalizeCode(sessionCode);

    return sessionsCollection()
      .doc(normalizedCode)
      .onSnapshot(
        (doc) => {
          // FIX: exists() est maintenant une méthode
          if (doc.exists()) {
            const session: Session = {
              id: doc.id,
              ...doc.data(),
            } as Session;
            onUpdate(session);
          } else {
            onError?.(getSessionErrorMessage("SESSION_NOT_FOUND"));
          }
        },
        (error) => {
          console.error("[SessionService] Session listener error:", error);
          onError?.(getSessionErrorMessage("NETWORK_ERROR"));
        }
      );
  },

  /**
   * Met à jour le statut
   */
  updateSessionStatus: async (
    sessionCode: string,
    status: SessionStatus
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const updateData: Partial<Session> = { status };

      if (status === "completed") {
        updateData.completedAt = serverTimestamp() as any;
      }

      await sessionsCollection().doc(normalizedCode).update(updateData);

      console.log(`[SessionService] Session ${sessionCode} status updated to: ${status}`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Update status error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Complète un défi
   *
   * FIX BUG COUPLES MÊME GENRE :
   * La validation utilise forPlayer (rôle) au lieu de forGender (genre)
   * Le validateur est l'OPPOSÉ de celui qui fait le défi (forPlayer)
   */
  completeChallenge: async (
    sessionCode: string,
    challengeIndex: number,
    odfsdfhdjsud: string
  ): Promise<ApiResponse<SessionChallenge | null>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      if (session.status !== "active") {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_COMPLETED"),
        };
      }

      if (challengeIndex < 0 || challengeIndex >= session.challenges.length) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_NOT_FOUND"),
        };
      }

      if (session.challenges[challengeIndex].completed) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_ALREADY_COMPLETED"),
        };
      }

      // ============================================================
      // FIX BUG COUPLES MÊME GENRE
      // Utilise forPlayer (rôle) au lieu de forGender (genre)
      // ============================================================
      const currentChallenge = session.challenges[challengeIndex];
      const userRole = getUserRoleInSession(session, odfsdfhdjsud);

      if (!userRole) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Le validateur est l'OPPOSÉ de celui qui fait le défi
      // Si forPlayer = "creator", le validateur est "partner"
      // Si forPlayer = "partner", le validateur est "creator"
      const expectedValidator: PlayerRole = currentChallenge.forPlayer === "creator" ? "partner" : "creator";

      if (userRole !== expectedValidator) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_YOUR_TURN"),
        };
      }
      // ============================================================

      const updatedChallenges = [...session.challenges];
      updatedChallenges[challengeIndex] = {
        ...updatedChallenges[challengeIndex],
        completed: true,
        completedBy: odfsdfhdjsud,
        completedAt: firestore.Timestamp.now(),
      };

      const nextIndex = challengeIndex + 1;
      const isLastChallenge = nextIndex >= session.challengeCount;

      // Le prochain "currentPlayer" = forPlayer du prochain défi
      const nextChallenge = isLastChallenge ? null : updatedChallenges[nextIndex];
      const nextPlayer: PlayerRole = nextChallenge ? nextChallenge.forPlayer : "creator";

      const updateData: Partial<Session> = {
        challenges: updatedChallenges,
        currentChallengeIndex: nextIndex,
        currentPlayer: nextPlayer,
      };

      if (isLastChallenge) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp() as any;
      }

      await sessionRef.update(updateData);

      console.log(
        `[SessionService] Challenge ${challengeIndex} validated by ${userRole} in session ${sessionCode}`
      );

      return {
        success: true,
        data: nextChallenge,
      };
    } catch (error: any) {
      console.error("[SessionService] Complete challenge error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Échange un défi et incrémente le compteur de changements
   */
  swapChallenge: async (
    sessionCode: string,
    challengeIndex: number,
    newChallenge: SessionChallenge,
    odfsdfhdjsud: string
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      if (challengeIndex < 0 || challengeIndex >= session.challenges.length) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_NOT_FOUND"),
        };
      }

      // Déterminer le rôle du joueur
      const userRole = getUserRoleInSession(session, odfsdfhdjsud);
      if (!userRole) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Mettre à jour les défis
      const updatedChallenges = [...session.challenges];
      updatedChallenges[challengeIndex] = newChallenge;

      // Incrémenter le compteur de changements
      const updateData: Partial<Session> = {
        challenges: updatedChallenges,
      };

      if (userRole === "creator") {
        updateData.creatorChangesUsed = (session.creatorChangesUsed || 0) + 1;
      } else {
        updateData.partnerChangesUsed = (session.partnerChangesUsed || 0) + 1;
      }

      await sessionRef.update(updateData);

      console.log(`[SessionService] Challenge ${challengeIndex} swapped by ${userRole} in session ${sessionCode}`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Swap challenge error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Abandonne une session
   */
  abandonSession: async (
    sessionCode: string,
    odfsdfhdjsud: string
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      if (session.creatorId !== odfsdfhdjsud && session.partnerId !== odfsdfhdjsud) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      await sessionRef.update({
        status: "abandoned",
        completedAt: serverTimestamp(),
      });

      console.log(`[SessionService] Session ${sessionCode} abandoned by user ${odfsdfhdjsud}`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Abandon session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Supprime une session
   */
  deleteSession: async (
    sessionCode: string,
    odfsdfhdjsud: string
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // FIX: exists() est maintenant une méthode
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      if (session.creatorId !== odfsdfhdjsud) {
        return {
          success: false,
          error: "Seul le créateur peut supprimer la session",
        };
      }

      if (session.status === "active") {
        return {
          success: false,
          error: "Impossible de supprimer une session en cours",
        };
      }

      await sessionRef.delete();

      console.log(`[SessionService] Session ${sessionCode} deleted`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Delete session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère les sessions actives
   */
  getActiveSessions: async (odfsdfhdjsud: string): Promise<ApiResponse<Session[]>> => {
    try {
      const creatorQuery = await sessionsCollection()
        .where("creatorId", "==", odfsdfhdjsud)
        .where("status", "in", ["waiting", "active"])
        .get();

      const partnerQuery = await sessionsCollection()
        .where("partnerId", "==", odfsdfhdjsud)
        .where("status", "==", "active")
        .get();

      const sessions: Session[] = [];

      creatorQuery.docs.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        } as Session);
      });

      partnerQuery.docs.forEach((doc) => {
        if (!sessions.find((s) => s.id === doc.id)) {
          sessions.push({
            id: doc.id,
            ...doc.data(),
          } as Session);
        }
      });

      return {
        success: true,
        data: sessions,
      };
    } catch (error: any) {
      console.error("[SessionService] Get active sessions error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère l'historique
   */
  getSessionHistory: async (
    odfsdfhdjsud: string,
    limit: number = 10
  ): Promise<ApiResponse<Session[]>> => {
    try {
      const creatorQuery = await sessionsCollection()
        .where("creatorId", "==", odfsdfhdjsud)
        .where("status", "in", ["completed", "abandoned"])
        .orderBy("completedAt", "desc")
        .limit(limit)
        .get();

      const partnerQuery = await sessionsCollection()
        .where("partnerId", "==", odfsdfhdjsud)
        .where("status", "in", ["completed", "abandoned"])
        .orderBy("completedAt", "desc")
        .limit(limit)
        .get();

      const sessions: Session[] = [];

      creatorQuery.docs.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        } as Session);
      });

      partnerQuery.docs.forEach((doc) => {
        if (!sessions.find((s) => s.id === doc.id)) {
          sessions.push({
            id: doc.id,
            ...doc.data(),
          } as Session);
        }
      });

      sessions.sort((a, b) => {
        const dateA = a.completedAt?.toDate?.() || new Date(0);
        const dateB = b.completedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        success: true,
        data: sessions.slice(0, limit),
      };
    } catch (error: any) {
      console.error("[SessionService] Get session history error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },
};

export default sessionService;