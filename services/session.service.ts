/**
 * Service de gestion des sessions de jeu
 *
 * Gère toutes les opérations liées aux sessions :
 * - Génération de codes uniques
 * - Création/suppression de sessions
 * - Rejoindre une session
 * - Synchronisation temps réel
 * - Progression des défis
 * - Changement de défi avec alternatives
 *
 * PROMPT 4.2 : Ajout vérifications premium + getCurrentChallenge + addBonusChanges
 * PROMPT 7.3 : Intégration showInterstitial() au début de partie (gratuit)
 * 
 * FIX BUG COUPLES MÊME GENRE :
 * La validation utilise maintenant forPlayer (rôle) au lieu de forGender
 * 
 * FIX BUG 15 DÉFIS PREMIUM :
 * La vérification utilise maintenant challengeCount / 2 (défis par joueur)
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
  CHALLENGE_COUNT_FREE,
  MAX_CHALLENGE_CHANGES,
  MAX_BONUS_CHANGES,
} from "../types";
import {
  getAlternatives,
  SelectionConfig,
  ChallengeAlternatives,
} from "../utils/challengeSelector";
// PROMPT 7.3 : Import du service de publicités
import { adsService } from "./ads.service";

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
  PREMIUM_REQUIRED: "Cette fonctionnalité nécessite un abonnement Premium",
  CHALLENGE_COUNT_EXCEEDED: "Le nombre de défis dépasse la limite gratuite",
  INTENSITY_LEVEL_LOCKED: "Ce niveau d'intensité est réservé aux Premium",
  TOYS_PREMIUM_ONLY: "Les défis avec jouets sont réservés aux Premium",
  MAX_BONUS_REACHED: "Vous avez atteint le maximum de bonus",
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
// INTERFACE DE CONFIGURATION ÉTENDUE
// ============================================================

/**
 * Configuration étendue pour la création de session
 * Inclut les options premium
 */
export interface ExtendedCreateSessionData extends CreateSessionData {
  /** Thèmes sélectionnés (Premium) */
  selectedThemes?: string[];
  /** Inclure les défis avec jouets (Premium) */
  includeToys?: boolean;
  /** Jouets disponibles (Premium) */
  availableToys?: string[];
  /** Préférences média */
  mediaPreferences?: {
    photo: boolean;
    audio: boolean;
    video: boolean;
  };
}

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

  // ============================================================
  // VÉRIFICATIONS PREMIUM (Prompt 4.2)
  // ============================================================

  /**
   * Vérifie les restrictions premium pour la configuration
   * 
   * FIX BUG 15 DÉFIS :
   * - challengeCount est le TOTAL de défis (count × 2)
   * - On divise par 2 pour obtenir le nombre PAR JOUEUR
   * - CHALLENGE_COUNT_FREE.max (15) est le max PAR JOUEUR
   * - Donc 15 défis par joueur = 30 total → 30/2 = 15 → 15 > 15 = false → OK !
   * 
   * @returns null si OK, sinon le message d'erreur
   */
  validatePremiumRestrictions: (
    config: ExtendedCreateSessionData,
    isPremium: boolean
  ): string | null => {
    // ============================================================
    // FIX BUG 15 DÉFIS PREMIUM
    // challengeCount est le TOTAL, on divise par 2 pour avoir PAR JOUEUR
    // ============================================================
    const challengesPerPlayer = Math.ceil(config.challengeCount / 2);
    
    // Vérification nombre de défis PAR JOUEUR (> 15 = premium)
    // 15 > 15 = false donc 15 est accepté pour gratuit
    if (challengesPerPlayer > CHALLENGE_COUNT_FREE.max && !isPremium) {
      console.log(`[SessionService] Premium check: ${challengesPerPlayer} per player > ${CHALLENGE_COUNT_FREE.max} max free`);
      return getSessionErrorMessage("CHALLENGE_COUNT_EXCEEDED");
    }

    // Vérification niveau d'intensité (niveau 4 = premium)
    if (config.startIntensity > 3 && !isPremium) {
      return getSessionErrorMessage("INTENSITY_LEVEL_LOCKED");
    }

    // Vérification jouets (premium uniquement)
    if (config.includeToys && !isPremium) {
      return getSessionErrorMessage("TOYS_PREMIUM_ONLY");
    }

    return null; // OK
  },

  /**
   * Crée une nouvelle session avec vérifications premium
   * 
   * PROMPT 4.2 : Ajout des vérifications :
   * - challengeCount > 15 PAR JOUEUR → vérifier premium
   * - startIntensity > 3 → vérifier premium  
   * - includeToys → vérifier premium
   * 
   * PROMPT 7.3 : Ajout de showInterstitial() pour les utilisateurs gratuits
   */
  createSession: async (
    creatorId: string,
    creatorGender: Gender,
    config: ExtendedCreateSessionData,
    challenges: SessionChallenge[],
    isPremium: boolean = false
  ): Promise<ApiResponse<string>> => {
    try {
      // ============================================================
      // VÉRIFICATIONS PREMIUM (Prompt 4.2)
      // ============================================================
      const premiumError = sessionService.validatePremiumRestrictions(config, isPremium);
      if (premiumError) {
        console.warn("[SessionService] Premium restriction:", premiumError);
        return {
          success: false,
          error: premiumError,
          code: "PREMIUM_REQUIRED",
        };
      }

      // ============================================================
      // PROMPT 7.3 : Afficher pub interstitielle pour utilisateurs gratuits
      // ============================================================
      if (!isPremium) {
        try {
          console.log("[SessionService] Showing interstitial for free user");
          await adsService.showInterstitial(false);
        } catch (adError) {
          // Ne pas bloquer la création si la pub échoue
          console.warn("[SessionService] Interstitial failed, continuing:", adError);
        }
      }

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

      console.log(`[SessionService] Session created: ${sessionCode} (${config.challengeCount} total challenges, ${Math.ceil(config.challengeCount / 2)} per player)`);

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

      // Rejoindre et démarrer la session (startSession intégré)
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

  // ============================================================
  // GET CURRENT CHALLENGE (Prompt 4.2)
  // ============================================================

  /**
   * Récupère le défi actuel d'une session
   */
  getCurrentChallenge: async (
    sessionCode: string
  ): Promise<ApiResponse<{ challenge: SessionChallenge; index: number } | null>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;

      if (session.status !== "active") {
        return {
          success: true,
          data: null,
        };
      }

      const index = session.currentChallengeIndex;
      const challenge = session.challenges[index];

      if (!challenge) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: true,
        data: { challenge, index },
      };
    } catch (error: any) {
      console.error("[SessionService] Get current challenge error:", error);
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

  // ============================================================
  // GET ALTERNATIVES (Prompt 4.2)
  // ============================================================

  /**
   * Récupère 2 alternatives pour changer un défi
   */
  getChallengeAlternatives: (
    session: Session,
    challengeIndex: number,
    isPremium: boolean
  ): ChallengeAlternatives => {
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

    return getAlternatives(session.challenges, challengeIndex, config);
  },

  /**
   * Échange un défi et incrémente le compteur de changements
   */
  swapChallenge: async (
    sessionCode: string,
    challengeIndex: number,
    newChallenge: SessionChallenge,
    odfsdfhdjsud: string,
    isPremium: boolean = false
  ): Promise<ApiResponse> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

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

      // Vérifier s'il reste des changements (sauf Premium illimité)
      if (!isPremium) {
        const changesUsed = userRole === "creator" 
          ? session.creatorChangesUsed 
          : session.partnerChangesUsed;
        const bonusChanges = userRole === "creator"
          ? session.creatorBonusChanges
          : session.partnerBonusChanges;
        const maxChanges = MAX_CHALLENGE_CHANGES + bonusChanges;

        if (changesUsed >= maxChanges) {
          return {
            success: false,
            error: getSessionErrorMessage("NO_CHANGES_LEFT"),
          };
        }
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

  // ============================================================
  // ADD BONUS CHANGES (Prompt 4.2 - pour pubs rewarded)
  // ============================================================

  /**
   * Ajoute des changements bonus via pub rewarded
   */
  addBonusChanges: async (
    sessionCode: string,
    odfsdfhdjsud: string,
    bonusAmount: number = 1
  ): Promise<ApiResponse<number>> => {
    const normalizedCode = normalizeCode(sessionCode);

    try {
      const sessionRef = sessionsCollection().doc(normalizedCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getSessionErrorMessage("SESSION_NOT_FOUND"),
        };
      }

      const session = sessionDoc.data() as Omit<Session, "id">;
      const userRole = getUserRoleInSession(session, odfsdfhdjsud);

      if (!userRole) {
        return {
          success: false,
          error: getSessionErrorMessage("NOT_SESSION_MEMBER"),
        };
      }

      // Vérifier le maximum de bonus
      const currentBonus = userRole === "creator"
        ? session.creatorBonusChanges
        : session.partnerBonusChanges;

      if (currentBonus >= MAX_BONUS_CHANGES) {
        return {
          success: false,
          error: getSessionErrorMessage("MAX_BONUS_REACHED"),
        };
      }

      const newBonus = Math.min(currentBonus + bonusAmount, MAX_BONUS_CHANGES);
      const updateData: Partial<Session> = {};

      if (userRole === "creator") {
        updateData.creatorBonusChanges = newBonus;
      } else {
        updateData.partnerBonusChanges = newBonus;
      }

      await sessionRef.update(updateData);

      console.log(`[SessionService] Bonus added for ${userRole} in session ${sessionCode}: ${newBonus}`);

      return {
        success: true,
        data: newBonus,
      };
    } catch (error: any) {
      console.error("[SessionService] Add bonus changes error:", error);
      return {
        success: false,
        error: getSessionErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère les changements restants pour un joueur
   */
  getRemainingChanges: (
    session: Session,
    userRole: PlayerRole,
    isPremium: boolean
  ): { remaining: number; total: number; isUnlimited: boolean } => {
    if (isPremium) {
      return { remaining: Infinity, total: Infinity, isUnlimited: true };
    }

    const changesUsed = userRole === "creator"
      ? session.creatorChangesUsed
      : session.partnerChangesUsed;
    const bonusChanges = userRole === "creator"
      ? session.creatorBonusChanges
      : session.partnerBonusChanges;

    const total = MAX_CHALLENGE_CHANGES + bonusChanges;
    const remaining = Math.max(0, total - changesUsed);

    return { remaining, total, isUnlimited: false };
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