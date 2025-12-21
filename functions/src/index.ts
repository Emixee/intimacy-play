/**
 * Cloud Functions pour Intimacy Play
 *
 * Fonctions :
 * - onPartnerJoined : Envoie une notification push au créateur quand le partenaire rejoint
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Initialiser Firebase Admin
initializeApp();

// Limite globale des instances (contrôle des coûts)
setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

// Références
const db = getFirestore();
const messaging = getMessaging();

// ============================================================
// INTERFACES
// ============================================================

interface Session {
  creatorId: string;
  partnerId: string | null;
  status: "waiting" | "active" | "completed" | "abandoned";
  challengeCount: number;
}

interface User {
  displayName: string;
  fcmToken: string | null;
  notificationsEnabled: boolean;
}

// ============================================================
// FONCTION : Notification quand partenaire rejoint
// ============================================================

/**
 * Déclenché quand une session est mise à jour
 * Envoie une notification push au créateur si :
 * - partnerId passe de null à une valeur (partenaire vient de rejoindre)
 * - Le créateur a un token FCM valide
 * - Les notifications sont activées
 */
export const onPartnerJoined = onDocumentUpdated(
  "sessions/{sessionId}",
  async (event) => {
    const sessionId = event.params.sessionId;

    // Récupérer les données avant/après
    const beforeData = event.data?.before.data() as Session | undefined;
    const afterData = event.data?.after.data() as Session | undefined;

    if (!beforeData || !afterData) {
      logger.warn(`[onPartnerJoined] No data for session ${sessionId}`);
      return;
    }

    // Vérifier si le partenaire vient de rejoindre
    const partnerJustJoined =
      beforeData.partnerId === null && afterData.partnerId !== null;

    if (!partnerJustJoined) {
      // Pas de changement de partenaire, ignorer
      return;
    }

    logger.info(
      `[onPartnerJoined] Partner joined session ${sessionId}`,
      { creatorId: afterData.creatorId, partnerId: afterData.partnerId }
    );

    try {
      // Récupérer les infos du créateur (pour le token FCM)
      const creatorDoc = await db
        .collection("users")
        .doc(afterData.creatorId)
        .get();

      if (!creatorDoc.exists) {
        logger.warn(
          `[onPartnerJoined] Creator not found: ${afterData.creatorId}`
        );
        return;
      }

      const creator = creatorDoc.data() as User;

      // Vérifier si le créateur a les notifications activées
      if (!creator.notificationsEnabled) {
        logger.info(
          `[onPartnerJoined] Creator has notifications disabled`
        );
        return;
      }

      // Vérifier si le créateur a un token FCM
      if (!creator.fcmToken) {
        logger.warn(
          `[onPartnerJoined] Creator has no FCM token: ${afterData.creatorId}`
        );
        return;
      }

      // Récupérer le nom du partenaire
      const partnerDoc = await db
        .collection("users")
        .doc(afterData.partnerId!)
        .get();

      const partnerName = partnerDoc.exists
        ? (partnerDoc.data() as User).displayName
        : "Votre partenaire";

      // Construire la notification
      const message = {
        token: creator.fcmToken,
        notification: {
          title: "💕 C'est parti !",
          body: `${partnerName} a rejoint la partie. ${afterData.challengeCount} défis vous attendent !`,
        },
        data: {
          type: "partner_joined",
          sessionId: sessionId,
        },
        android: {
          notification: {
            channelId: "game_notifications",
            priority: "high" as const,
            sound: "default",
          },
        },
      };

      // Envoyer la notification
      const response = await messaging.send(message);

      logger.info(
        `[onPartnerJoined] Notification sent successfully`,
        { messageId: response, sessionId }
      );
    } catch (error) {
      logger.error(`[onPartnerJoined] Error sending notification`, error);
    }
  }
);

// ============================================================
// FONCTION : Nettoyage des sessions expirées (optionnel)
// ============================================================

// À implémenter plus tard si besoin avec onSchedule
// export const cleanupExpiredSessions = onSchedule("every 24 hours", async () => {
//   // Supprimer les sessions "waiting" créées il y a plus de 24h
// });