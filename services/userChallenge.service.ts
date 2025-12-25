/**
 * Service de gestion des défis créés par les utilisateurs
 * 
 * PROMPT PARTNER-CHALLENGE
 * 
 * Fonctionnalités :
 * - Sauvegarde des défis créés par les partenaires
 * - Récupération pour modération
 * - Statistiques sur les défis utilisateurs
 * 
 * Ces défis sont stockés pour :
 * 1. Permettre la modération
 * 2. Possibilité d'ajouter les meilleurs à la base de défis officielle
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  serverTimestamp,
  userChallengesCollection,
} from "../config/firebase";
import {
  UserChallenge,
  ModerationStatus,
  IntensityLevel,
  ChallengeType,
  Gender,
  ApiResponse,
} from "../types";

// ============================================================
// TYPES
// ============================================================

export interface CreateUserChallengeData {
  text: string;
  level: IntensityLevel;
  type: ChallengeType;
  forGender: Gender;
  createdBy: string;
  sessionId: string;
}

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TEXT: "Le texte du défi est invalide",
  CREATE_FAILED: "Erreur lors de la sauvegarde du défi",
  NOT_FOUND: "Défi introuvable",
  UNKNOWN_ERROR: "Une erreur est survenue",
};

const getErrorMessage = (key: string): string => {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// SERVICE
// ============================================================

export const userChallengeService = {
  /**
   * Sauvegarde un défi créé par un utilisateur
   * Le défi est stocké avec le statut "pending" pour modération
   */
  async saveUserChallenge(
    data: CreateUserChallengeData
  ): Promise<ApiResponse<string>> {
    try {
      // Validation basique
      if (!data.text || data.text.trim().length < 10) {
        return {
          success: false,
          error: getErrorMessage("INVALID_TEXT"),
        };
      }

      const docRef = userChallengesCollection().doc();

      const challengeDoc: Omit<UserChallenge, "id"> = {
        text: data.text.trim(),
        level: data.level,
        type: data.type,
        forGender: data.forGender,
        createdBy: data.createdBy,
        sessionId: data.sessionId,
        moderationStatus: "pending" as ModerationStatus,
        createdAt: serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await docRef.set(challengeDoc);

      console.log("[UserChallengeService] Challenge saved:", docRef.id);

      return {
        success: true,
        data: docRef.id,
      };
    } catch (error: any) {
      console.error("[UserChallengeService] Save error:", error);
      return {
        success: false,
        error: getErrorMessage("CREATE_FAILED"),
      };
    }
  },

  /**
   * Récupère les défis créés par un utilisateur
   */
  async getUserChallenges(
    userId: string,
    limit: number = 20
  ): Promise<ApiResponse<UserChallenge[]>> {
    try {
      const snapshot = await userChallengesCollection()
        .where("createdBy", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const challenges: UserChallenge[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserChallenge[];

      return {
        success: true,
        data: challenges,
      };
    } catch (error: any) {
      console.error("[UserChallengeService] Get user challenges error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère les défis en attente de modération
   * (Pour le panel admin futur)
   */
  async getPendingChallenges(
    limit: number = 50
  ): Promise<ApiResponse<UserChallenge[]>> {
    try {
      const snapshot = await userChallengesCollection()
        .where("moderationStatus", "==", "pending")
        .orderBy("createdAt", "asc")
        .limit(limit)
        .get();

      const challenges: UserChallenge[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserChallenge[];

      return {
        success: true,
        data: challenges,
      };
    } catch (error: any) {
      console.error("[UserChallengeService] Get pending error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Met à jour le statut de modération d'un défi
   * (Pour le panel admin futur)
   */
  async updateModerationStatus(
    challengeId: string,
    status: ModerationStatus,
    moderatorId: string,
    note?: string
  ): Promise<ApiResponse> {
    try {
      const updateData: Partial<UserChallenge> = {
        moderationStatus: status,
        moderatedBy: moderatorId,
        moderatedAt: firestore.Timestamp.now(),
      };

      if (note) {
        updateData.moderationNote = note;
      }

      await userChallengesCollection().doc(challengeId).update(updateData);

      console.log(
        "[UserChallengeService] Moderation updated:",
        challengeId,
        status
      );

      return { success: true };
    } catch (error: any) {
      console.error("[UserChallengeService] Update moderation error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère les statistiques des défis utilisateurs
   */
  async getStats(): Promise
    ApiResponse<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }>
  > {
    try {
      // Note: Pour de meilleures performances, utiliser des compteurs agrégés
      // ou Cloud Functions pour maintenir ces stats
      const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
        userChallengesCollection()
          .where("moderationStatus", "==", "pending")
          .count()
          .get(),
        userChallengesCollection()
          .where("moderationStatus", "==", "approved")
          .count()
          .get(),
        userChallengesCollection()
          .where("moderationStatus", "==", "rejected")
          .count()
          .get(),
      ]);

      const pending = pendingSnap.data().count;
      const approved = approvedSnap.data().count;
      const rejected = rejectedSnap.data().count;

      return {
        success: true,
        data: {
          total: pending + approved + rejected,
          pending,
          approved,
          rejected,
        },
      };
    } catch (error: any) {
      console.error("[UserChallengeService] Get stats error:", error);
      return {
        success: false,
        error: getErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },
};

export default userChallengeService;