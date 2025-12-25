/**
 * Service de gestion des médias du chat
 *
 * FIX COMPLET :
 * - ContentType explicite pour tous les types de médias
 * - Meilleure détection des extensions vidéo
 * - Logs détaillés pour debug
 * - Gestion robuste des erreurs
 */

import { Platform } from "react-native";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  firestore,
  storage,
  serverTimestamp,
  sessionsCollection,
  getSessionMediaPath,
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
  INVALID_URI: "Fichier média invalide",
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
  video: [".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp", ".m4v"],
  audio: [".mp3", ".m4a", ".wav", ".ogg", ".aac"],
};

// MIME types par extension - UTILISÉ POUR L'UPLOAD
const MIME_TYPES: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  // Vidéos
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".3gp": "video/3gpp",
  ".m4v": "video/x-m4v",
  // Audio
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
};

// MIME type par défaut selon le type
const DEFAULT_MIME_TYPES: Record<string, string> = {
  photo: "image/jpeg",
  video: "video/mp4",
  audio: "audio/mp4",
};

// ============================================================
// HELPERS
// ============================================================

const normalizeCode = (code: string): string => {
  return code.replace(/\s/g, "").toUpperCase();
};

const messagesCollection = (sessionCode: string) => {
  const normalizedCode = normalizeCode(sessionCode);
  return sessionsCollection().doc(normalizedCode).collection("messages");
};

/**
 * Valide et nettoie l'URI d'un fichier
 */
const validateAndCleanUri = (uri: string): { valid: boolean; cleanUri: string; error?: string } => {
  if (!uri || typeof uri !== "string") {
    return { valid: false, cleanUri: "", error: "URI invalide" };
  }

  let cleanUri = uri.trim();

  if (!cleanUri.startsWith("file://") && !cleanUri.startsWith("content://")) {
    if (cleanUri.startsWith("/")) {
      cleanUri = `file://${cleanUri}`;
    } else {
      return { valid: false, cleanUri: "", error: "Format URI non reconnu" };
    }
  }

  return { valid: true, cleanUri };
};

/**
 * Détermine l'extension depuis l'URI
 */
const getExtensionFromUri = (uri: string): string => {
  // Nettoyer l'URI des paramètres de requête
  const cleanUri = uri.split("?")[0].split("#")[0];
  
  // Essayer d'extraire l'extension
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    return `.${match[1].toLowerCase()}`;
  }

  return "";
};

/**
 * Obtient le MIME type pour une extension et un type donné
 */
const getMimeType = (extension: string, type: MessageType): string => {
  // Essayer de trouver le MIME type exact
  const mimeType = MIME_TYPES[extension.toLowerCase()];
  if (mimeType) {
    console.log(`[MediaService] MIME type from extension ${extension}: ${mimeType}`);
    return mimeType;
  }

  // Sinon, utiliser le MIME type par défaut
  const defaultMime = DEFAULT_MIME_TYPES[type] || "application/octet-stream";
  console.log(`[MediaService] Using default MIME type for ${type}: ${defaultMime}`);
  return defaultMime;
};

/**
 * Valide l'extension pour un type donné
 */
const isValidExtension = (extension: string, type: MessageType): boolean => {
  if (type === "text") return false;
  if (!extension) return false;
  const supported = SUPPORTED_EXTENSIONS[type];
  if (!supported) return false;
  return supported.includes(extension.toLowerCase());
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
  try {
    return expiresAt.toDate().getTime() < Date.now();
  } catch {
    return false;
  }
};

// ============================================================
// UPLOAD ROBUSTE AVEC CONTENT-TYPE
// ============================================================

/**
 * Upload un fichier avec gestion d'erreurs robuste et contentType explicite
 */
const uploadFileRobust = async (
  storagePath: string,
  localUri: string,
  contentType: string
): Promise<string> => {
  console.log(`[MediaService] uploadFileRobust`);
  console.log(`[MediaService] - Path: ${storagePath}`);
  console.log(`[MediaService] - URI: ${localUri.substring(0, 80)}...`);
  console.log(`[MediaService] - ContentType: ${contentType}`);

  try {
    const reference = storage().ref(storagePath);
    
    // FIX: Définir le contentType explicitement dans les metadata
    const metadata = {
      contentType: contentType,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        platform: Platform.OS,
      },
    };
    
    console.log("[MediaService] Starting upload with metadata:", JSON.stringify(metadata));
    
    // Upload avec metadata
    const uploadTask = reference.putFile(localUri, metadata);
    
    // Attendre la fin de l'upload
    await uploadTask;
    
    console.log("[MediaService] ✅ Upload completed, getting download URL...");
    
    // Récupérer l'URL de téléchargement
    const downloadUrl = await reference.getDownloadURL();
    
    console.log("[MediaService] ✅ Download URL:", downloadUrl.substring(0, 80) + "...");
    
    return downloadUrl;
  } catch (error: any) {
    console.error("[MediaService] ❌ uploadFileRobust error:", error);
    console.error("[MediaService] Error code:", error.code);
    console.error("[MediaService] Error message:", error.message);
    throw error;
  }
};

// ============================================================
// SERVICE MÉDIA
// ============================================================

export const mediaService = {
  /**
   * Envoie un message avec média
   */
  sendMediaMessage: async (
    sessionCode: string,
    senderId: string,
    senderGender: Gender,
    mediaUri: string,
    type: MessageType
  ): Promise<ApiResponse<Message>> => {
    console.log("[MediaService] ========================================");
    console.log("[MediaService] sendMediaMessage called");
    console.log(`[MediaService] Session: ${sessionCode}`);
    console.log(`[MediaService] Type: ${type}`);
    console.log(`[MediaService] URI: ${mediaUri.substring(0, 80)}...`);
    console.log("[MediaService] ========================================");

    try {
      // Validation du type
      if (type === "text") {
        console.error("[MediaService] Invalid type: text");
        return {
          success: false,
          error: getMediaErrorMessage("INVALID_MEDIA_TYPE"),
          code: "INVALID_MEDIA_TYPE",
        };
      }

      // Validation de l'URI
      const { valid, cleanUri, error } = validateAndCleanUri(mediaUri);
      if (!valid) {
        console.error("[MediaService] Invalid URI:", error);
        return {
          success: false,
          error: getMediaErrorMessage("INVALID_URI"),
          code: "INVALID_URI",
        };
      }

      const normalizedCode = normalizeCode(sessionCode);

      // Vérifier que la session existe
      const sessionDoc = await sessionsCollection().doc(normalizedCode).get();
      if (!sessionDoc.exists()) {
        console.error("[MediaService] Session not found:", normalizedCode);
        return {
          success: false,
          error: getMediaErrorMessage("SESSION_NOT_FOUND"),
          code: "SESSION_NOT_FOUND",
        };
      }

      // Extraire l'extension du fichier
      let extension = getExtensionFromUri(cleanUri);
      console.log(`[MediaService] Detected extension: "${extension}"`);
      
      // Si pas d'extension valide, utiliser une extension par défaut
      if (!extension || !isValidExtension(extension, type)) {
        console.warn(`[MediaService] Invalid/missing extension, using default for ${type}`);
        extension = type === "photo" ? ".jpg" : type === "video" ? ".mp4" : ".m4a";
      }

      console.log(`[MediaService] Final extension: ${extension}`);

      // Obtenir le MIME type
      const mimeType = getMimeType(extension, type);
      console.log(`[MediaService] MIME type: ${mimeType}`);

      // Générer le nom et le chemin du fichier
      const fileName = generateFileName(type, extension);
      const storagePath = getSessionMediaPath(normalizedCode, fileName);

      console.log(`[MediaService] Storage path: ${storagePath}`);

      // Upload vers Firebase Storage avec contentType explicite
      let mediaUrl: string;
      try {
        mediaUrl = await uploadFileRobust(storagePath, cleanUri, mimeType);
      } catch (uploadError: any) {
        console.error("[MediaService] Upload failed:", uploadError);
        
        if (uploadError.code === "storage/quota-exceeded") {
          return {
            success: false,
            error: getMediaErrorMessage("FILE_TOO_LARGE"),
            code: "FILE_TOO_LARGE",
          };
        }

        if (uploadError.code === "storage/unauthorized") {
          return {
            success: false,
            error: "Erreur d'autorisation. Vérifie les règles Firebase Storage.",
            code: "STORAGE_UNAUTHORIZED",
          };
        }

        if (uploadError.code === "storage/unknown" || uploadError.code === "storage/retry-limit-exceeded") {
          return {
            success: false,
            error: getMediaErrorMessage("NETWORK_ERROR"),
            code: "NETWORK_ERROR",
          };
        }

        return {
          success: false,
          error: getMediaErrorMessage("UPLOAD_FAILED"),
          code: "UPLOAD_FAILED",
        };
      }

      console.log("[MediaService] ✅ Upload successful, creating message...");

      // Calculer l'expiration
      const mediaExpiresAt = getExpirationTimestamp();

      // Créer le message
      const messageRef = messagesCollection(sessionCode).doc();

      const messageData: Omit<Message, "id"> = {
        senderId,
        senderGender,
        type,
        content: "",
        mediaUrl,
        mediaThumbnail: null,
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

      console.log(`[MediaService] ✅ Message created: ${messageRef.id}`);

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
      console.error("[MediaService] ❌ sendMediaMessage error:", error);
      console.error("[MediaService] Error stack:", error.stack?.substring(0, 300));

      return {
        success: false,
        error: getMediaErrorMessage("UPLOAD_FAILED"),
        code: "UPLOAD_FAILED",
      };
    }
  },

  /**
   * Télécharge un média dans la galerie (Premium uniquement)
   */
  downloadMedia: async (
    sessionCode: string,
    messageId: string,
    isPremium: boolean
  ): Promise<ApiResponse<{ url: string; type: MessageType }>> => {
    console.log(`[MediaService] downloadMedia - Message: ${messageId}`);
    
    try {
      if (!isPremium) {
        console.log("[MediaService] Premium required for download");
        return {
          success: false,
          error: getMediaErrorMessage("PREMIUM_REQUIRED"),
          code: "PREMIUM_REQUIRED",
        };
      }

      const messageRef = messagesCollection(sessionCode).doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists()) {
        console.log("[MediaService] Message not found:", messageId);
        return {
          success: false,
          error: getMediaErrorMessage("MESSAGE_NOT_FOUND"),
          code: "MESSAGE_NOT_FOUND",
        };
      }

      const message = messageDoc.data() as Message;

      if (message.type === "text" || !message.mediaUrl) {
        console.log("[MediaService] Not a media message");
        return {
          success: false,
          error: getMediaErrorMessage("MEDIA_NOT_FOUND"),
          code: "MEDIA_NOT_FOUND",
        };
      }

      if (isMediaExpired(message.mediaExpiresAt)) {
        console.log("[MediaService] Media expired");
        return {
          success: false,
          error: getMediaErrorMessage("MEDIA_EXPIRED"),
          code: "MEDIA_EXPIRED",
        };
      }

      await messageRef.update({
        mediaDownloaded: true,
      });

      console.log(`[MediaService] Media marked as downloaded: ${messageId}`);

      return {
        success: true,
        data: {
          url: message.mediaUrl,
          type: message.type,
        },
      };
    } catch (error: any) {
      console.error("[MediaService] downloadMedia error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("DOWNLOAD_FAILED"),
        code: "DOWNLOAD_FAILED",
      };
    }
  },

  /**
   * Vérifie si un média est encore disponible
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
      console.error("[MediaService] isMediaAvailable error:", error);
      return false;
    }
  },

  /**
   * Calcule le temps restant avant expiration
   */
  getRemainingTime: (
    expiresAt: FirebaseFirestoreTypes.Timestamp | null
  ): number => {
    if (!expiresAt) return 0;

    try {
      const remaining = expiresAt.toDate().getTime() - Date.now();
      return Math.max(0, Math.floor(remaining / 1000));
    } catch {
      return 0;
    }
  },

  /**
   * Formate le temps restant
   */
  formatRemainingTime: (seconds: number): string => {
    if (seconds <= 0) return "Expiré";

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  /**
   * Supprime un média
   */
  deleteMedia: async (
    sessionCode: string,
    fileName: string
  ): Promise<ApiResponse> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);
      const storagePath = getSessionMediaPath(normalizedCode, fileName);

      await storage().ref(storagePath).delete();

      console.log(`[MediaService] Media deleted: ${storagePath}`);

      return { success: true };
    } catch (error: any) {
      if (error.code === "storage/object-not-found") {
        return { success: true };
      }
      
      console.error("[MediaService] deleteMedia error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Supprime tous les médias d'une session
   */
  deleteAllSessionMedia: async (
    sessionCode: string
  ): Promise<ApiResponse<number>> => {
    try {
      const normalizedCode = normalizeCode(sessionCode);
      const mediaPath = `sessions/${normalizedCode}/media`;

      const listResult = await storage().ref(mediaPath).listAll();

      if (listResult.items.length === 0) {
        return { success: true, data: 0 };
      }

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
      console.error("[MediaService] deleteAllSessionMedia error:", error);
      return {
        success: false,
        error: getMediaErrorMessage("UNKNOWN_ERROR"),
      };
    }
  },

  /**
   * Détermine le type de média depuis l'URI
   */
  detectMediaType: (uri: string): MessageType | null => {
    const extension = getExtensionFromUri(uri);

    if (SUPPORTED_EXTENSIONS.photo.includes(extension)) return "photo";
    if (SUPPORTED_EXTENSIONS.video.includes(extension)) return "video";
    if (SUPPORTED_EXTENSIONS.audio.includes(extension)) return "audio";

    return null;
  },

  /**
   * Vérifie si une extension est supportée
   */
  isExtensionSupported: (extension: string, type: MessageType): boolean => {
    return isValidExtension(extension, type);
  },

  // Constantes exportées
  EXPIRATION_MINUTES: MEDIA_EXPIRATION_MINUTES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_EXTENSIONS,
  MIME_TYPES,
};

export default mediaService;