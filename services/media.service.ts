/**
 * Service de gestion des médias du chat
 *
 * Gère l'upload et le téléchargement des médias éphémères :
 * - Upload vers Firebase Storage
 * - Création du message avec expiration (10 min)
 * - Téléchargement dans la galerie (Premium)
 * - Génération de thumbnails pour vidéos
 *
 * IMPORTANT: Les médias expirent après 10 minutes et sont
 * automatiquement supprimés par la Cloud Function cleanupExpiredMedia
 */

import { Platform } from "react-native";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  storage,
  serverTimestamp,
  sessionsCollection,
  getSessionMediaPath,
  uploadFile,
  deleteFile,
} from "../config/firebase";
import {
  Message,
  MessageType,
  Gender,
  ApiResponse,
  MEDIA_EXPIRATION_MINUTES,
} from "../types";

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const MEDIA_ERROR_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: "Session introuvable",
  MESSAGE_NOT_FOUND: "Message introuvable",
  MEDIA_NOT_FOUND: "Média introuvable ou expiré",
  MEDIA_EXPIRED: "Ce média a expiré et n'est plus disponible",
  MEDIA_ALREADY_DOWNLOADED: "Ce média a déjà été téléchargé",
  PREMIUM_REQUIRED: "Le téléchargement est réservé aux membres Premium",
  UPLOAD_FAILED: "Échec de l'envoi du média",
  DOWNLOAD_FAILED: "Échec du téléchargement",
  INVALID_MEDIA_TYPE: "Type de média non supporté",
  FILE_TOO_LARGE: "Fichier trop volumineux (max 50 Mo)",
  UNKNOWN_ERROR: "Une erreur est survenue",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre réseau",
};

const getMediaErrorMessage = (errorKey: string): string => {
  return MEDIA_ERROR_MESSAGES[errorKey] || MEDIA_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================
// CONSTANTES
// ============================================================

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Extensions supportées par type
const SUPPORTED_EXTENSIONS: Record<string, string[]> = {
  photo: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"],
  video: [".mp4", ".mov", ".avi", ".webm", ".mkv"],
  audio: [".mp3", ".m4a", ".wav", ".ogg", ".aac"],
};

// MIME types par extension
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
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
 * Référence à la sous-collection messages
 */
const messagesCollection = (sessionCode: string) => {
  const normalizedCode = normalizeCode(sessionCode);
  return sessionsCollection().doc(normalizedCode).collection("messages");
};

/**
 * Détermine le type de média depuis l'URI
 */
const getMediaTypeFromUri = (uri: string): MessageType | null => {
  const extension = uri.substring(uri.lastIndexOf(".")).toLowerCase();

  if (SUPPORTED_EXTENSIONS.photo.includes(extension)) return "photo";
  if (SUPPORTED_EXTENSIONS.video.includes(extension)) return "video";
  if (SUPPORTED_EXTENSIONS.audio.includes(extension)) return "audio";

  return null;
};

/**
 * Génère un nom de fichier unique
 */
const generateFileName = (type: MessageType, extension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}_${timestamp}_${random}${extension}`;
};

/**
 * Calcule le timestamp d'expiration
 */
const getExpirationTimestamp = (): FirebaseFirestoreTypes.Timestamp => {
  const expirationDate = new Date(
    Date.now() + MEDIA_EXPIRATION_MINUTES * 60 * 1000
  );
  return firestore.Timestamp.fromDate(expirationDate);
};

/**
 * Vérifie si un média est expiré
 */
const isMediaExpired = (
  expiresAt: FirebaseFirestoreTypes.Timestamp | null
): boolean => {
  if (!expiresAt) return false;
  return expiresAt.toDate().getTime() < Date.now();
};

// ============================================================
// SERVICE MÉDIA
// ============================================================

export const mediaService = {
  /**
   * Envoie un message avec média
   *
   * Upload le fichier vers Firebase Storage et crée un message
   * avec une expiration de 10 minutes.
   *
   * @param sessionCode - Code de la session
   * @param senderId - UID de l'expéditeur
   * @param senderGender - Genre de l'expéditeur
   * @param mediaUri - URI locale du fichier (file:///...)
   * @param type - Type de média (photo, video, audio)
   * @returns Message créé avec l'URL du média
   */
  sendMediaMessage: async (
    sessionCode: string,
    senderId: string,
    senderGender: Gender,
    mediaUri: string,
    type: MessageType
  ): Promise<ApiResponse<Message>> => {
    try {
      // Validation du type
      if (type === "text") {
        return {
          success: false,
          error: getMediaErrorMessage("INVALID_MEDIA_TYPE"),
          code: "INVALID_MEDIA_TYPE",
        };
      }

      const normalizedCode = normalizeCode(sessionCode);

      // Vérifier que la session existe
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();
      if (!sessionDoc.exists()) {
        return {
          success: false,
          error: getMediaErrorMessage("SESSION_NOT_FOUND"),
          code: "SESSION_NOT_FOUND",
        };
      }

      // Extraire l'extension du fichier
      const extension = mediaUri.substring(mediaUri.lastIndexOf(".")).toLowerCase();

      // Valider l'extension
      if (!SUPPORTED_EXTENSIONS[type]?.includes(extension)) {
        return {
          success: false,
          error: getMediaErrorMessage("INVALID_MEDIA_TYPE"),
          code: "INVALID_MEDIA_TYPE",
        };
      }

      // Générer le nom et le chemin du fichier
      const fileName = generateFileName(type, extension);
      const storagePath = getSessionMediaPath(normalizedCode, fileName);

      console.log(`[MediaService] Uploading ${type} to ${storagePath}`);

      // Upload vers Firebase Storage
      const mediaUrl = await uploadFile(storagePath, mediaUri);

      // Calculer l'expiration
      const mediaExpiresAt = getExpirationTimestamp();

      // Créer le message
      const messageRef = messagesCollection(sessionCode).doc();

      const messageData: Omit<Message, "id"> = {
        senderId,
        senderGender,
        type,
        content: "", // Vide pour les médias
        mediaUrl,
        mediaThumbnail: null, // TODO: Générer thumbnail pour vidéos
        mediaExpiresAt,
        mediaDownloaded: false,
        read: false,
        readAt: null,
        createdAt: serverTimestamp() as any,
      };

      await messageRef.set({
        id: messageRef.id,
        ...messageData,
      });

      console.log(`[MediaService] Media message sent: ${messageRef.id}`);

      // Retourner le message
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
      console.error("[MediaService] Send media message error:", error);

      // Erreur spécifique pour fichier trop gros
      if (error.code === "storage/quota-exceeded") {
        return {
          success: false,
          error: getMediaErrorMessage("FILE_TOO_LARGE"),
          code: "FILE_TOO_LARGE",
        };
      }

      return {
        success: false,
        error: getMediaErrorMessage("UPLOAD_FAILED"),
        code: "UPLOAD_FAILED",
      };
    }
  },

  /**
   * Télécharge un média dans la galerie (Premium uniquement)
   *
   * Vérifie que l'utilisateur est Premium avant de permettre
   * le téléchargement. Marque le message comme téléchargé.
   *
   * @param sessionCode - Code de la session
   * @param messageId - ID du message contenant le média
   * @param isPremium - L'utilisateur est-il Premium ?
   * @returns URL du média pour téléchargement
   */
  downloadMedia: async (
    sessionCode: string,
    messageId: string,
    isPremium: boolean
  ): Promise<ApiResponse<{ url: string; type: MessageType }>> => {
    try {
      // Vérification Premium
      if (!isPremium) {
        return {
          success: false,
          error: getMediaErrorMessage("PREMIUM_REQUIRED"),
          code: "PREMIUM_REQUIRED",
        };
      }

      const messageRef = messagesCollection(sessionCode).doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists()) {
        return {
          success: false,
          error: getMediaErrorMessage("MESSAGE_NOT_FOUND"),
          code: "MESSAGE_NOT_FOUND",
        };
      }

      const message = messageDoc.data() as Message;

      // Vérifier que c'est bien un média
      if (message.type === "text" || !message.mediaUrl) {
        return {
          success: false,
          error: getMediaErrorMessage("MEDIA_NOT_FOUND"),
          code: "MEDIA_NOT_FOUND",
        };
      }

      // Vérifier l'expiration
      if (isMediaExpired(message.mediaExpiresAt)) {
        return {
          success: false,
          error: getMediaErrorMessage("MEDIA_EXPIRED"),
          code: "MEDIA_EXPIRED",
        };
      }

      // Marquer comme téléchargé
      await messageRef.update({
        mediaDownloaded: true,
      });

      console.log(`[MediaService] Media downloaded: ${messageId}`);

      return {
        success: true,
        data: {
          url: message.mediaUrl,
          type: message.type,
        },
      };
    } catch (error: any) {
      console.error("[MediaService] Download media error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("DOWNLOAD_FAILED"),
        code: "DOWNLOAD_FAILED",
      };
    }
  },

  /**
   * Vérifie si un média est encore disponible (non expiré)
   *
   * @param sessionCode - Code de la session
   * @param messageId - ID du message
   * @returns true si le média est disponible
   */
  isMediaAvailable: async (
    sessionCode: string,
    messageId: string
  ): Promise<boolean> => {
    try {
      const messageRef = messagesCollection(sessionCode).doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists()) return false;

      const message = messageDoc.data() as Message;

      if (!message.mediaUrl || !message.mediaExpiresAt) return false;

      return !isMediaExpired(message.mediaExpiresAt);
    } catch (error) {
      console.error("[MediaService] Check media availability error:", error);
      return false;
    }
  },

  /**
   * Calcule le temps restant avant expiration (en secondes)
   *
   * @param expiresAt - Timestamp d'expiration
   * @returns Secondes restantes (0 si expiré)
   */
  getRemainingTime: (
    expiresAt: FirebaseFirestoreTypes.Timestamp | null
  ): number => {
    if (!expiresAt) return 0;

    const remaining = expiresAt.toDate().getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  },

  /**
   * Formate le temps restant en string lisible (MM:SS)
   *
   * @param seconds - Secondes restantes
   * @returns Format "MM:SS"
   */
  formatRemainingTime: (seconds: number): string => {
    if (seconds <= 0) return "Expiré";

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  /**
   * Supprime un média de Storage (utilisé par Cloud Function)
   *
   * @param sessionCode - Code de la session
   * @param fileName - Nom du fichier
   * @returns Succès ou erreur
   */
  deleteMedia: async (
    sessionCode: string,
    fileName: string
  ): Promise<ApiResponse> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);
      const storagePath = getSessionMediaPath(normalizedCode, fileName);

      await deleteFile(storagePath);

      console.log(`[MediaService] Media deleted: ${storagePath}`);

      return { success: true };
    } catch (error: any) {
      console.error("[MediaService] Delete media error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Supprime tous les médias d'une session (fin de partie)
   *
   * @param sessionCode - Code de la session
   * @returns Nombre de fichiers supprimés
   */
  deleteAllSessionMedia: async (
    sessionCode: string
  ): Promise<ApiResponse<number>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);
      const mediaPath = `sessions/${normalizedCode}/media`;

      // Lister tous les fichiers
      const listResult = await storage().ref(mediaPath).listAll();

      if (listResult.items.length === 0) {
        return { success: true, data: 0 };
      }

      // Supprimer chaque fichier
      const deletePromises = listResult.items.map((ref) => ref.delete());
      await Promise.all(deletePromises);

      console.log(
        `[MediaService] Deleted ${listResult.items.length} media files from session ${sessionCode}`
      );

      return {
        success: true,
        data: listResult.items.length,
      };
    } catch (error: any) {
      console.error("[MediaService] Delete all session media error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Détermine automatiquement le type de média depuis l'URI
   *
   * @param uri - URI du fichier
   * @returns Type de média ou null si non supporté
   */
  detectMediaType: (uri: string): MessageType | null => {
    return getMediaTypeFromUri(uri);
  },

  /**
   * Vérifie si une extension est supportée pour un type donné
   *
   * @param extension - Extension du fichier (avec le point)
   * @param type - Type de média attendu
   * @returns true si supporté
   */
  isExtensionSupported: (extension: string, type: MessageType): boolean => {
    if (type === "text") return false;
    return SUPPORTED_EXTENSIONS[type]?.includes(extension.toLowerCase()) ?? false;
  },

  // ============================================================
  // CONSTANTES EXPORTÉES
  // ============================================================

  /** Durée d'expiration en minutes */
  EXPIRATION_MINUTES: MEDIA_EXPIRATION_MINUTES,

  /** Taille maximale des fichiers en Mo */
  MAX_FILE_SIZE_MB,

  /** Taille maximale des fichiers en bytes */
  MAX_FILE_SIZE_BYTES,

  /** Extensions supportées par type */
  SUPPORTED_EXTENSIONS,

  /** MIME types par extension */
  MIME_TYPES,
};

export default mediaService;