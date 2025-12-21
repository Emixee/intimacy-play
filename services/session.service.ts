/**
 * Service de gestion des sessions de jeu
 *
 * Gère toutes les opérations liées aux sessions :
 * - Génération de codes uniques
 * - Création/suppression de sessions
 * - Rejoindre une session
 * - Synchronisation temps réel
 * - Progression des défis
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
  ChallengeTemplate,
} from "../types";

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const SESSION_ERROR_MESSAGES: Record<string, string> = {
  // Erreurs de session
  SESSION_NOT_FOUND: "Session introuvable",
  SESSION_FULL: "Cette session est déjà complète",
  SESSION_EXPIRED: "Cette session a expiré",
  SESSION_ALREADY_STARTED: "Cette session a déjà commencé",
  SESSION_ABANDONED: "Cette session a été abandonnée",
  SESSION_COMPLETED: "Cette session est terminée",

  // Erreurs de participation
  NOT_SESSION_MEMBER: "Vous n'êtes pas membre de cette session",
  CANNOT_JOIN_OWN_SESSION: "Vous ne pouvez pas rejoindre votre propre session",
  ALREADY_IN_SESSION: "Vous êtes déjà dans cette session",

  // Erreurs de défi
  CHALLENGE_NOT_FOUND: "Défi introuvable",
  CHALLENGE_ALREADY_COMPLETED: "Ce défi a déjà été accompli",
  NOT_YOUR_TURN: "Ce n'est pas votre tour",

  // Erreurs générales
  UNKNOWN_ERROR: "Une erreur est survenue",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre réseau",
};

/**
 * Récupère un message d'erreur en français
 */
const getSessionErrorMessage = (errorKey: string): string => {
  return SESSION_ERROR_MESSAGES[errorKey] || SESSION_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Caractères utilisés pour générer les codes de session
 * Exclusion des caractères ambigus : 0, O, I, 1, l
 */
const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Longueur du code de session
 */
const CODE_LENGTH = 6;

/**
 * Durée d'expiration d'une session en attente (en heures)
 */
const SESSION_EXPIRATION_HOURS = 24;

/**
 * Vérifie si une session est expirée
 */
const isSessionExpired = (createdAt: FirebaseFirestoreTypes.Timestamp): boolean => {
  const expirationTime = createdAt.toDate().getTime() + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000;
  return Date.now() > expirationTime;
};

// ============================================================
// SERVICE DE SESSION
// ============================================================

export const sessionService = {
  // ----------------------------------------------------------
  // GÉNÉRATION DE CODE
  // ----------------------------------------------------------

  /**
   * Génère un code de session unique de 6 caractères
   * Format : 3 lettres + espace + 3 caractères (ex: "MBW YY4")
   *
   * @returns Code unique formaté
   */
  generateSessionCode(): string {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * CODE_CHARACTERS.length);
      code += CODE_CHARACTERS[randomIndex];
    }
    // Format : ABC DEF
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  },

  /**
   * Normalise un code de session (supprime espaces, met en majuscules)
   *
   * @param code - Code saisi par l'utilisateur
   * @returns Code normalisé
   */
  normalizeSessionCode(code: string): string {
    return code.replace(/\s/g, "").toUpperCase();
  },

  /**
   * Vérifie si un code de session existe déjà
   *
   * @param code - Code à vérifier
   * @returns true si le code existe déjà
   */
  async isCodeTaken(code: string): Promise<boolean> {
    const normalizedCode = this.normalizeSessionCode(code);
    const doc = await sessionsCollection().doc(normalizedCode).get();
    return doc.exists;
  },

  /**
   * Génère un code unique qui n'existe pas dans la base
   *
   * @returns Code unique garanti
   */
  async generateUniqueCode(): Promise<string> {
    let code = this.generateSessionCode();
    let normalizedCode = this.normalizeSessionCode(code);
    let attempts = 0;
    const maxAttempts = 10;

    while (await this.isCodeTaken(normalizedCode) && attempts < maxAttempts) {
      code = this.generateSessionCode();
      normalizedCode = this.normalizeSessionCode(code);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Impossible de générer un code unique");
    }

    return code;
  },

  // ----------------------------------------------------------
  // CRÉATION DE SESSION
  // ----------------------------------------------------------

  /**
   * Crée une nouvelle session de jeu
   *
   * @param creatorId - UID du créateur
   * @param creatorGender - Genre du créateur
   * @param config - Configuration de la session (nombre de défis, intensité)
   * @param challenges - Liste des défis générés pour la session
   * @returns ApiResponse avec le code de session
   */
  async createSession(
    creatorId: string,
    creatorGender: Gender,
    config: CreateSessionData,
    challenges: SessionChallenge[]
  ): Promise<ApiResponse<string>> {
    try {
      // 1. Générer un code unique
      const sessionCode = await this.generateUniqueCode();
      const normalizedCode = this.normalizeSessionCode(sessionCode);

      // 2. Créer le document de session
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

  // ----------------------------------------------------------
  // REJOINDRE UNE SESSION
  // ----------------------------------------------------------

  /**
   * Permet à un partenaire de rejoindre une session existante
   *
   * @param sessionCode - Code de la session à rejoindre
   * @param partnerId - UID du partenaire
   * @param partnerGender - Genre du partenaire
   * @returns ApiResponse avec les données de la session
   */
  async joinSession(
    sessionCode: string,
    partnerId: string,
    partnerGender: Gender
  ): Promise<ApiResponse<Session>> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      // Vérification : la session existe-t-elle ?
      if (!sessionDoc.exists) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const sessionData = sessionDoc.data() as Omit<Session, "id">;

      // Vérification : le partenaire n'est pas le créateur
      if (sessionData.creatorId === partnerId) {
        return {
          success: false,
          error: getSessionErrorMessage("CANNOT_JOIN_OWN_SESSION"),
        };
      }

      // Vérification : la session est en attente
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

      // Vérification : la session n'est pas déjà pleine
      if (sessionData.partnerId !== null) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_FULL"),
        };
      }

      // Vérification : la session n'est pas expirée
      if (isSessionExpired(sessionData.createdAt as FirebaseFirestoreTypes.Timestamp)) {
        // Marquer la session comme abandonnée
        await sessionRef.update({ status: "abandoned" });
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_EXPIRED"),
        };
      }

      // Mettre à jour la session
      await sessionRef.update({
        partnerId,
        partnerGender,
        status: "active",
        startedAt: serverTimestamp(),
      });

      // Récupérer la session mise à jour
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

  // ----------------------------------------------------------
  // RÉCUPÉRATION DE SESSION
  // ----------------------------------------------------------

  /**
   * Récupère une session par son code
   *
   * @param sessionCode - Code de la session
   * @returns ApiResponse avec les données de la session
   */
  async getSession(sessionCode: string): Promise<ApiResponse<Session>> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();

      if (!sessionDoc.exists) {
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
   * Vérifie si un utilisateur est membre d'une session
   *
   * @param session - Session à vérifier
   * @param userId - UID de l'utilisateur
   * @returns true si l'utilisateur est membre
   */
  isSessionMember(session: Session, userId: string): boolean {
    return session.creatorId === userId || session.partnerId === userId;
  },

  /**
   * Détermine le rôle d'un utilisateur dans une session
   *
   * @param session - Session
   * @param userId - UID de l'utilisateur
   * @returns Rôle de l'utilisateur ou null si pas membre
   */
  getUserRole(session: Session, userId: string): PlayerRole | null {
    if (session.creatorId === userId) return "creator";
    if (session.partnerId === userId) return "partner";
    return null;
  },

  // ----------------------------------------------------------
  // ÉCOUTE EN TEMPS RÉEL
  // ----------------------------------------------------------

  /**
   * S'abonne aux changements d'une session en temps réel
   *
   * @param sessionCode - Code de la session
   * @param onUpdate - Callback appelé à chaque mise à jour
   * @param onError - Callback appelé en cas d'erreur
   * @returns Fonction de désinscription
   */
  subscribeToSession(
    sessionCode: string,
    onUpdate: (session: Session) => void,
    onError?: (error: string) => void
  ): () => void {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    return sessionsCollection()
      .doc(normalizedCode)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
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

  // ----------------------------------------------------------
  // MISE À JOUR DU STATUT
  // ----------------------------------------------------------

  /**
   * Met à jour le statut d'une session
   *
   * @param sessionCode - Code de la session
   * @param status - Nouveau statut
   * @returns ApiResponse void
   */
  async updateSessionStatus(
    sessionCode: string,
    status: SessionStatus
  ): Promise<ApiResponse> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const updateData: Partial<Session> = { status };

      // Ajouter completedAt si la session est terminée
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

  // ----------------------------------------------------------
  // COMPLÉTION DE DÉFI
  // ----------------------------------------------------------

  /**
   * Marque un défi comme accompli et passe au suivant
   *
   * @param sessionCode - Code de la session
   * @param challengeIndex - Index du défi accompli
   * @param userId - UID de l'utilisateur qui complète le défi
   * @returns ApiResponse avec le prochain défi ou null si terminé
   */
  async completeChallenge(
    sessionCode: string,
    challengeIndex: number,
    userId: string
  ): Promise<ApiResponse<SessionChallenge | null>> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      // Vérification : la session est active
      if (session.status !== "active") {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_COMPLETED"),
        };
      }

      // Vérification : l'index est valide
      if (challengeIndex < 0 || challengeIndex >= session.challenges.length) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_NOT_FOUND"),
        };
      }

      // Vérification : le défi n'est pas déjà accompli
      if (session.challenges[challengeIndex].completed) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_ALREADY_COMPLETED"),
        };
      }

      // Vérification : c'est bien le tour de l'utilisateur
      const userRole = this.getUserRole({ ...session, id: normalizedCode }, userId);
      if (userRole !== session.currentPlayer) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_YOUR_TURN"),
        };
      }

      // Mettre à jour le défi
      const updatedChallenges = [...session.challenges];
      updatedChallenges[challengeIndex] = {
        ...updatedChallenges[challengeIndex],
        completed: true,
        completedBy: userId,
        completedAt: firestore.Timestamp.now(),
      };

      // Calculer le prochain index et joueur
      const nextIndex = challengeIndex + 1;
      const isLastChallenge = nextIndex >= session.challengeCount;
      const nextPlayer: PlayerRole = session.currentPlayer === "creator" ? "partner" : "creator";

      // Préparer les données de mise à jour
      const updateData: Partial<Session> = {
        challenges: updatedChallenges,
        currentChallengeIndex: nextIndex,
        currentPlayer: nextPlayer,
      };

      // Si c'est le dernier défi, marquer comme terminé
      if (isLastChallenge) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp() as any;
      }

      await sessionRef.update(updateData);

      console.log(`[SessionService] Challenge ${challengeIndex} completed in session ${sessionCode}`);

      // Retourner le prochain défi ou null si terminé
      const nextChallenge = isLastChallenge ? null : updatedChallenges[nextIndex];

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

  // ----------------------------------------------------------
  // CHANGEMENT DE DÉFI
  // ----------------------------------------------------------

  /**
   * Remplace le défi actuel par un autre (max 2 fois)
   *
   * @param sessionCode - Code de la session
   * @param challengeIndex - Index du défi à remplacer
   * @param newChallenge - Nouveau défi
   * @returns ApiResponse void
   */
  async swapChallenge(
    sessionCode: string,
    challengeIndex: number,
    newChallenge: SessionChallenge
  ): Promise<ApiResponse> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      // Vérification : l'index est valide
      if (challengeIndex < 0 || challengeIndex >= session.challenges.length) {
        return {
          success: false,
          error: getSessionErrorMessage("CHALLENGE_NOT_FOUND"),
        };
      }

      // Mettre à jour le défi
      const updatedChallenges = [...session.challenges];
      updatedChallenges[challengeIndex] = newChallenge;

      await sessionRef.update({ challenges: updatedChallenges });

      console.log(`[SessionService] Challenge ${challengeIndex} swapped in session ${sessionCode}`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Swap challenge error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  // ----------------------------------------------------------
  // ABANDON DE SESSION
  // ----------------------------------------------------------

  /**
   * Abandonne une session en cours
   *
   * @param sessionCode - Code de la session
   * @param userId - UID de l'utilisateur qui abandonne
   * @returns ApiResponse void
   */
  async abandonSession(
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      // Vérification : l'utilisateur est membre de la session
      if (session.creatorId !== userId && session.partnerId !== userId) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      await sessionRef.update({
        status: "abandoned",
        completedAt: serverTimestamp(),
      });

      console.log(`[SessionService] Session ${sessionCode} abandoned by user ${userId}`);

      return { success: true };
    } catch (error: any) {
      console.error("[SessionService] Abandon session error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  // ----------------------------------------------------------
  // SUPPRESSION DE SESSION
  // ----------------------------------------------------------

  /**
   * Supprime une session (uniquement par le créateur si en attente)
   *
   * @param sessionCode - Code de la session
   * @param userId - UID de l'utilisateur qui supprime
   * @returns ApiResponse void
   */
  async deleteSession(
    sessionCode: string,
    userId: string
  ): Promise<ApiResponse> {
    const normalizedCode = this.normalizeSessionCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      // Seul le créateur peut supprimer
      if (session.creatorId !== userId) {
        return {
          success: false,
          error: "Seul le créateur peut supprimer la session",
        };
      }

      // Ne peut supprimer que si en attente ou abandonnée/terminée
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

  // ----------------------------------------------------------
  // SESSIONS ACTIVES DE L'UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Récupère les sessions actives d'un utilisateur (créateur ou partenaire)
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse avec la liste des sessions
   */
  async getActiveSessions(userId: string): Promise<ApiResponse<Session[]>> {
    try {
      // Sessions où l'utilisateur est créateur
      const creatorQuery = await sessionsCollection()
        .where("creatorId", "==", userId)
        .where("status", "in", ["waiting", "active"])
        .get();

      // Sessions où l'utilisateur est partenaire
      const partnerQuery = await sessionsCollection()
        .where("partnerId", "==", userId)
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
        // Éviter les doublons (peu probable mais sécurité)
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
   * Récupère l'historique des sessions terminées d'un utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @param limit - Nombre maximum de sessions à retourner
   * @returns ApiResponse avec la liste des sessions
   */
  async getSessionHistory(
    userId: string,
    limit: number = 10
  ): Promise<ApiResponse<Session[]>> {
    try {
      // Sessions terminées où l'utilisateur est créateur
      const creatorQuery = await sessionsCollection()
        .where("creatorId", "==", userId)
        .where("status", "in", ["completed", "abandoned"])
        .orderBy("completedAt", "desc")
        .limit(limit)
        .get();

      // Sessions terminées où l'utilisateur est partenaire
      const partnerQuery = await sessionsCollection()
        .where("partnerId", "==", userId)
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

      // Trier par date de complétion et limiter
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

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default sessionService;