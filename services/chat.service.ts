/**
 * Service de gestion du chat en session
 *
 * Gère toutes les opérations de messagerie :
 * - Envoi de messages texte
 * - Écoute temps réel des messages
 * - Marquage comme lu
 * - Comptage des messages non lus
 *
 * Sous-collection : /sessions/{sessionCode}/messages/{messageId}
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  serverTimestamp,
  sessionsCollection,
} from "../config/firebase";
import {
  Message,
  MessageType,
  Gender,
  ApiResponse,
} from "../types";

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const CHAT_ERROR_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: "Session introuvable",
  MESSAGE_NOT_FOUND: "Message introuvable",
  MESSAGE_EMPTY: "Le message ne peut pas être vide",
  SEND_FAILED: "Échec de l'envoi du message",
  NOT_SESSION_MEMBER: "Vous n'êtes pas membre de cette session",
  UNKNOWN_ERROR: "Une erreur est survenue",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre réseau",
};

const getChatErrorMessage = (errorKey: string): string => {
  return CHAT_ERROR_MESSAGES[errorKey] || CHAT_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalise un code de session (supprime espaces, majuscules)
 */
const normalizeCode = (code: string): string => {
  return code.replace(/\s/g, "").toUpperCase();
};

/**
 * Référence à la sous-collection messages d'une session
 */
const messagesCollection = (sessionCode: string) => {
  const normalizedCode = normalizeCode(sessionCode);
  return sessionsCollection().doc(normalizedCode).collection("messages");
};

// ============================================================
// SERVICE CHAT
// ============================================================

export const chatService = {
  /**
   * Envoie un message texte
   *
   * @param sessionCode - Code de la session
   * @param senderId - UID de l'expéditeur
   * @param senderGender - Genre de l'expéditeur
   * @param content - Contenu du message
   * @returns Message créé
   */
  sendMessage: async (
    sessionCode: string,
    senderId: string,
    senderGender: Gender,
    content: string
  ): Promise<ApiResponse<Message>> => {
    try {
      // Validation du contenu
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return {
          success: false,
          error: getChatErrorMessage("MESSAGE_EMPTY"),
          code: "MESSAGE_EMPTY",
        };
      }

      const normalizedCode = normalizeCode(sessionCode);

      // Vérifier que la session existe
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getChatErrorMessage("SESSION_NOT_FOUND"),
          code: "SESSION_NOT_FOUND",
        };
      }

      // Créer le message
      const messageRef = messagesCollection(sessionCode).doc();

      const messageData: Omit<Message, "id"> = {
        senderId,
        senderGender,
        type: "text",
        content: trimmedContent,
        mediaUrl: null,
        mediaThumbnail: null,
        mediaExpiresAt: null,
        mediaDownloaded: false,
        read: false,
        readAt: null,
        createdAt: serverTimestamp() as any,
      };

      await messageRef.set({
        id: messageRef.id,
        ...messageData,
      });

      console.log(`[ChatService] Message sent in session ${sessionCode}`);

      // Retourner le message avec un timestamp approximatif
      const message: Message = {
        id: messageRef.id,
        ...messageData,
        createdAt: firestore.Timestamp.now(),
      };

      return {
        success: true,
        data: message,
      };
    } catch (error: any) {
      console.error("[ChatService] Send message error:", error);
      return {
        success: false,
        error: getChatErrorMessage("SEND_FAILED"),
        code: "SEND_FAILED",
      };
    }
  },

  /**
   * S'abonne aux messages d'une session en temps réel
   *
   * @param sessionCode - Code de la session
   * @param callback - Fonction appelée à chaque mise à jour
   * @param onError - Fonction appelée en cas d'erreur
   * @returns Fonction de désabonnement
   */
  subscribeToMessages: (
    sessionCode: string,
    callback: (messages: Message[]) => void,
    onError?: (error: string) => void
  ): (() => void) => {
    const normalizedCode = normalizeCode(sessionCode);

    const unsubscribe = sessionsCollection()
      .doc(normalizedCode)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {
          const messages: Message[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              senderId: data.senderId,
              senderGender: data.senderGender,
              type: data.type,
              content: data.content,
              mediaUrl: data.mediaUrl,
              mediaThumbnail: data.mediaThumbnail,
              mediaExpiresAt: data.mediaExpiresAt,
              mediaDownloaded: data.mediaDownloaded,
              read: data.read,
              readAt: data.readAt,
              createdAt: data.createdAt,
            } as Message);
          });

          callback(messages);
        },
        (error) => {
          console.error("[ChatService] Messages listener error:", error);
          onError?.(getChatErrorMessage("NETWORK_ERROR"));
        }
      );

    return unsubscribe;
  },

  /**
   * Marque un message comme lu
   *
   * @param sessionCode - Code de la session
   * @param messageId - ID du message
   * @returns Succès ou erreur
   */
  markAsRead: async (
    sessionCode: string,
    messageId: string
  ): Promise<ApiResponse> => {
    try {
      const messageRef = messagesCollection(sessionCode).doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists()) {
        return {
          success: false,
          error: getChatErrorMessage("MESSAGE_NOT_FOUND"),
          code: "MESSAGE_NOT_FOUND",
        };
      }

      // Ne mettre à jour que si pas déjà lu
      const data = messageDoc.data();
      if (data?.read) {
        return { success: true };
      }

      await messageRef.update({
        read: true,
        readAt: serverTimestamp(),
      });

      console.log(`[ChatService] Message ${messageId} marked as read`);

      return { success: true };
    } catch (error: any) {
      console.error("[ChatService] Mark as read error:", error);
      return {
        success: false,
        error: getChatErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Marque tous les messages d'un expéditeur comme lus
   *
   * @param sessionCode - Code de la session
   * @param readerId - UID du lecteur (on marque les messages des autres)
   * @returns Nombre de messages marqués
   */
  markAllAsRead: async (
    sessionCode: string,
    readerId: string
  ): Promise<ApiResponse<number>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);

      // Récupérer tous les messages non lus des autres
      const snapshot = await sessionsCollection()
        .doc(normalizedCode)
        .collection("messages")
        .where("read", "==", false)
        .get();

      const batch = firestore().batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Ne marquer que les messages des autres
        if (data.senderId !== readerId) {
          batch.update(doc.ref, {
            read: true,
            readAt: serverTimestamp(),
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`[ChatService] Marked ${count} messages as read`);
      }

      return {
        success: true,
        data: count,
      };
    } catch (error: any) {
      console.error("[ChatService] Mark all as read error:", error);
      return {
        success: false,
        error: getChatErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Compte les messages non lus
   *
   * @param sessionCode - Code de la session
   * @param readerId - UID du lecteur
   * @returns Nombre de messages non lus
   */
  getUnreadCount: async (
    sessionCode: string,
    readerId: string
  ): Promise<ApiResponse<number>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);

      const snapshot = await sessionsCollection()
        .doc(normalizedCode)
        .collection("messages")
        .where("read", "==", false)
        .get();

      // Compter uniquement les messages des autres
      const count = snapshot.docs.filter(
        (doc) => doc.data().senderId !== readerId
      ).length;

      return {
        success: true,
        data: count,
      };
    } catch (error: any) {
      console.error("[ChatService] Get unread count error:", error);
      return {
        success: false,
        error: getChatErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Récupère les derniers messages (pagination)
   *
   * @param sessionCode - Code de la session
   * @param limit - Nombre de messages à récupérer
   * @param beforeTimestamp - Récupérer les messages avant ce timestamp (pagination)
   * @returns Liste des messages
   */
  getMessages: async (
    sessionCode: string,
    limit: number = 50,
    beforeTimestamp?: FirebaseFirestoreTypes.Timestamp
  ): Promise<ApiResponse<Message[]>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);

      let query = sessionsCollection()
        .doc(normalizedCode)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (beforeTimestamp) {
        query = query.startAfter(beforeTimestamp);
      }

      const snapshot = await query.get();

      const messages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      // Inverser pour avoir l'ordre chronologique
      messages.reverse();

      return {
        success: true,
        data: messages,
      };
    } catch (error: any) {
      console.error("[ChatService] Get messages error:", error);
      return {
        success: false,
        error: getChatErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Supprime tous les messages d'une session (appelé à la fin de partie)
   * Note: Utilisé par la Cloud Function de nettoyage
   *
   * @param sessionCode - Code de la session
   * @returns Succès ou erreur
   */
  deleteAllMessages: async (sessionCode: string): Promise<ApiResponse<number>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);

      const snapshot = await sessionsCollection()
        .doc(normalizedCode)
        .collection("messages")
        .get();

      if (snapshot.empty) {
        return { success: true, data: 0 };
      }

      const batch = firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`[ChatService] Deleted ${snapshot.size} messages from session ${sessionCode}`);

      return {
        success: true,
        data: snapshot.size,
      };
    } catch (error: any) {
      console.error("[ChatService] Delete all messages error:", error);
      return {
        success: false,
        error: getChatErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },
};

export default chatService;