/**
 * Cloud Function - Nettoyage des médias expirés
 *
 * Firebase Functions v2 pour Node.js 20
 *
 * Cette fonction s'exécute toutes les 5 minutes pour :
 * 1. Supprimer les médias expirés (mediaExpiresAt < now)
 * 2. Nettoyer les médias des sessions terminées
 *
 * Déploiement :
 * cd functions
 * npm install
 * firebase deploy --only functions
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialiser Firebase Admin
initializeApp();

const db = getFirestore();
const storage = getStorage().bucket();

// ============================================================
// CONFIGURATION
// ============================================================

/** Limite Firestore pour les batch writes */
const BATCH_SIZE = 500;

/** Préfixe du chemin de stockage des médias */
const MEDIA_PATH_PREFIX = "sessions";

/** Région de déploiement (Europe pour meilleure latence France) */
const REGION = "europe-west1";

// ============================================================
// TYPES
// ============================================================

interface StorageError extends Error {
  code?: number | string;
}

interface FileMetadata {
  size?: string | number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Extrait le chemin complet du fichier depuis l'URL Firebase Storage
 */
const extractStoragePathFromUrl = (url: string): string | null => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const match = decodedUrl.match(/\/o\/([^?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Supprime un fichier de Storage de manière sécurisée
 */
const safeDeleteFile = async (filePath: string): Promise<boolean> => {
  try {
    await storage.file(filePath).delete();
    console.log(`[Cleanup] Deleted file: ${filePath}`);
    return true;
  } catch (error: unknown) {
    const storageError = error as StorageError;
    if (storageError.code === 404) {
      console.log(`[Cleanup] File not found (already deleted): ${filePath}`);
      return true;
    }
    console.error(`[Cleanup] Error deleting file ${filePath}:`, storageError.message);
    return false;
  }
};

/**
 * Supprime une liste de fichiers en parallèle
 */
const deleteFilesInParallel = async (
  filePaths: string[]
): Promise<{ success: number; errors: number }> => {
  const results = await Promise.all(filePaths.map(safeDeleteFile));
  return {
    success: results.filter((r) => r).length,
    errors: results.filter((r) => !r).length,
  };
};

// ============================================================
// FONCTION 1 : Nettoyage des médias expirés (scheduled)
// ============================================================

export const cleanupExpiredMedia = onSchedule(
  {
    schedule: "every 5 minutes",
    region: REGION,
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    console.log("[Cleanup] Starting expired media cleanup...");
    console.log(`[Cleanup] Execution time: ${new Date().toISOString()}`);

    const now = Timestamp.now();
    let totalDeleted = 0;
    let totalErrors = 0;
    let sessionsProcessed = 0;

    try {
      const sessionsSnapshot = await db
        .collection("sessions")
        .where("status", "in", ["waiting", "active"])
        .get();

      console.log(`[Cleanup] Found ${sessionsSnapshot.size} active sessions`);

      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionCode = sessionDoc.id;

        const expiredMessagesSnapshot = await db
          .collection("sessions")
          .doc(sessionCode)
          .collection("messages")
          .where("mediaExpiresAt", "!=", null)
          .where("mediaExpiresAt", "<", now)
          .get();

        if (expiredMessagesSnapshot.empty) {
          continue;
        }

        console.log(
          `[Cleanup] Found ${expiredMessagesSnapshot.size} expired media in session ${sessionCode}`
        );

        sessionsProcessed++;
        const filesToDelete: string[] = [];
        const batch = db.batch();

        for (const messageDoc of expiredMessagesSnapshot.docs) {
          const message = messageDoc.data();

          if (message.mediaUrl) {
            const storagePath = extractStoragePathFromUrl(message.mediaUrl);
            if (storagePath) {
              filesToDelete.push(storagePath);
            }
          }

          if (message.mediaThumbnail) {
            const thumbnailPath = extractStoragePathFromUrl(message.mediaThumbnail);
            if (thumbnailPath) {
              filesToDelete.push(thumbnailPath);
            }
          }

          batch.update(messageDoc.ref, {
            mediaUrl: null,
            mediaThumbnail: null,
            mediaExpiresAt: null,
            content: "[Média expiré]",
          });
        }

        const deleteResults = await deleteFilesInParallel(filesToDelete);
        totalDeleted += deleteResults.success;
        totalErrors += deleteResults.errors;

        await batch.commit();

        console.log(
          `[Cleanup] Session ${sessionCode}: ${deleteResults.success} files deleted, ${deleteResults.errors} errors`
        );
      }

      console.log(
        `[Cleanup] Completed. Sessions: ${sessionsProcessed}, Deleted: ${totalDeleted}, Errors: ${totalErrors}`
      );
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[Cleanup] Fatal error during cleanup:", err.message);
      throw error;
    }
  }
);

// ============================================================
// FONCTION 2 : Nettoyage à la fin de session (trigger Firestore)
// ============================================================

export const onSessionCompleted = onDocumentUpdated(
  {
    document: "sessions/{sessionCode}",
    region: REGION,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const sessionCode = event.params.sessionCode;

    const wasActive = before?.status === "active" || before?.status === "waiting";
    const isEnded = after?.status === "completed" || after?.status === "abandoned";

    if (!wasActive || !isEnded) {
      return null;
    }

    console.log(`[Cleanup] Session ${sessionCode} ended with status: ${after?.status}`);
    console.log(`[Cleanup] Starting cleanup for session ${sessionCode}...`);

    let filesDeleted = 0;
    let messagesDeleted = 0;

    try {
      // ÉTAPE 1 : Supprimer tous les fichiers média de Storage
      const mediaPrefix = `${MEDIA_PATH_PREFIX}/${sessionCode}/media/`;

      try {
        const [files] = await storage.getFiles({ prefix: mediaPrefix });

        if (files.length > 0) {
          console.log(`[Cleanup] Found ${files.length} files in Storage`);

          const deletePromises = files.map((file) =>
            file.delete().catch((err: Error) => {
              console.error(`[Cleanup] Error deleting ${file.name}:`, err.message);
              return null;
            })
          );

          const results = await Promise.all(deletePromises);
          filesDeleted = results.filter((r) => r !== null).length;

          console.log(`[Cleanup] Deleted ${filesDeleted} files from Storage`);
        } else {
          console.log(`[Cleanup] No files found in Storage for session ${sessionCode}`);
        }
      } catch (storageError: unknown) {
        const err = storageError as Error;
        console.error("[Cleanup] Storage cleanup error:", err.message);
      }

      // ÉTAPE 2 : Supprimer tous les messages de la sous-collection
      const messagesSnapshot = await db
        .collection("sessions")
        .doc(sessionCode)
        .collection("messages")
        .get();

      if (!messagesSnapshot.empty) {
        console.log(`[Cleanup] Found ${messagesSnapshot.size} messages to delete`);

        const batches: FirebaseFirestore.WriteBatch[] = [];
        let currentBatch = db.batch();
        let operationCount = 0;

        for (const doc of messagesSnapshot.docs) {
          currentBatch.delete(doc.ref);
          operationCount++;

          if (operationCount === BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            operationCount = 0;
          }
        }

        if (operationCount > 0) {
          batches.push(currentBatch);
        }

        await Promise.all(batches.map((batch) => batch.commit()));

        messagesDeleted = messagesSnapshot.size;
        console.log(`[Cleanup] Deleted ${messagesDeleted} messages`);
      } else {
        console.log(`[Cleanup] No messages found for session ${sessionCode}`);
      }

      console.log(
        `[Cleanup] Session ${sessionCode} cleanup completed. ` +
          `Files: ${filesDeleted}, Messages: ${messagesDeleted}`
      );

      return null;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Cleanup] Error cleaning session ${sessionCode}:`, err.message);
      throw error;
    }
  }
);

// ============================================================
// FONCTION 3 : Nettoyage manuel (callable)
// ============================================================

interface ManualCleanupData {
  sessionCode?: string;
  force?: boolean;
}

interface ManualCleanupResponse {
  success: boolean;
  message: string;
  filesDeleted?: number;
  messagesDeleted?: number;
}

export const manualCleanup = onCall<ManualCleanupData>(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request): Promise<ManualCleanupResponse> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentification requise pour cette opération"
      );
    }

    const uid = request.auth.uid;
    console.log(`[ManualCleanup] Called by user: ${uid}`);

    const { sessionCode, force = false } = request.data;

    try {
      if (sessionCode) {
        console.log(`[ManualCleanup] Cleaning session: ${sessionCode}`);

        const sessionDoc = await db.collection("sessions").doc(sessionCode).get();

        if (!sessionDoc.exists) {
          return {
            success: false,
            message: `Session ${sessionCode} introuvable`,
          };
        }

        const sessionData = sessionDoc.data();

        if (!force && (sessionData?.status === "active" || sessionData?.status === "waiting")) {
          return {
            success: false,
            message: `La session ${sessionCode} est encore active. Utilisez force=true pour forcer la suppression.`,
          };
        }

        const mediaPrefix = `${MEDIA_PATH_PREFIX}/${sessionCode}/media/`;
        const [files] = await storage.getFiles({ prefix: mediaPrefix });

        let filesDeleted = 0;
        for (const file of files) {
          try {
            await file.delete();
            filesDeleted++;
          } catch (deleteError) {
            console.error(`[ManualCleanup] Error deleting ${file.name}:`, deleteError);
          }
        }

        const messagesSnapshot = await db
          .collection("sessions")
          .doc(sessionCode)
          .collection("messages")
          .get();

        let messagesDeleted = 0;
        if (!messagesSnapshot.empty) {
          const batch = db.batch();
          messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          messagesDeleted = messagesSnapshot.size;
        }

        console.log(
          `[ManualCleanup] Session ${sessionCode} cleaned: ${filesDeleted} files, ${messagesDeleted} messages`
        );

        return {
          success: true,
          message: `Session ${sessionCode} nettoyée`,
          filesDeleted,
          messagesDeleted,
        };
      } else {
        console.log("[ManualCleanup] Global cleanup requested");

        return {
          success: true,
          message:
            "Pour un nettoyage global, utilisez la fonction schedulée cleanupExpiredMedia " +
            "ou spécifiez un sessionCode pour nettoyer une session spécifique.",
        };
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[ManualCleanup] Error:", err.message);
      throw new HttpsError(
        "internal",
        `Erreur lors du nettoyage: ${err.message}`
      );
    }
  }
);

// ============================================================
// FONCTION BONUS : Statistiques de stockage
// ============================================================

interface StorageStatsResponse {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  totalMediaFiles: number;
  expiredMediaCount: number;
  storageUsedMB: number;
}

export const getStorageStats = onCall(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request): Promise<StorageStatsResponse> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentification requise"
      );
    }

    console.log("[Stats] Computing storage statistics...");

    try {
      const now = Timestamp.now();

      const allSessions = await db.collection("sessions").get();
      const activeSessions = await db
        .collection("sessions")
        .where("status", "in", ["waiting", "active"])
        .get();

      let totalMessages = 0;
      let expiredMediaCount = 0;

      for (const sessionDoc of allSessions.docs) {
        const messagesSnapshot = await db
          .collection("sessions")
          .doc(sessionDoc.id)
          .collection("messages")
          .get();

        totalMessages += messagesSnapshot.size;

        messagesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.mediaExpiresAt && data.mediaExpiresAt.toDate() < now.toDate()) {
            expiredMediaCount++;
          }
        });
      }

      const [files] = await storage.getFiles({ prefix: MEDIA_PATH_PREFIX });

      let totalSizeBytes = 0;
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const fileMetadata = metadata as FileMetadata;
        totalSizeBytes += parseInt(String(fileMetadata.size || 0), 10);
      }

      const stats: StorageStatsResponse = {
        totalSessions: allSessions.size,
        activeSessions: activeSessions.size,
        totalMessages,
        totalMediaFiles: files.length,
        expiredMediaCount,
        storageUsedMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100,
      };

      console.log("[Stats] Statistics computed:", stats);

      return stats;
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[Stats] Error computing statistics:", err.message);
      throw new HttpsError(
        "internal",
        `Erreur: ${err.message}`
      );
    }
  }
);