/**
 * Cloud Function - Nettoyage des médias expirés
 *
 * Cette fonction s'exécute toutes les 5 minutes pour :
 * 1. Supprimer les médias expirés (mediaExpiresAt < now)
 * 2. Nettoyer les médias des sessions terminées
 *
 * Déploiement :
 * cd functions
 * npm install
 * firebase deploy --only functions:cleanupExpiredMedia,functions:onSessionCompleted,functions:manualCleanup
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage().bucket();

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
 *
 * @param url - URL de téléchargement Firebase Storage
 * @returns Chemin du fichier dans le bucket ou null
 *
 * @example
 * // URL format:
 * // https://firebasestorage.googleapis.com/v0/b/bucket/o/sessions%2FCODE%2Fmedia%2Ffilename?...
 * extractStoragePathFromUrl(url) // "sessions/CODE/media/filename"
 */
const extractStoragePathFromUrl = (url: string): string | null => {
  try {
    const decodedUrl = decodeURIComponent(url);
    // Extraire le chemin après /o/ et avant ?
    const match = decodedUrl.match(/\/o\/([^?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Supprime un fichier de Storage de manière sécurisée
 * Ignore les erreurs si le fichier n'existe pas
 *
 * @param filePath - Chemin du fichier dans le bucket
 * @returns true si supprimé ou inexistant, false si erreur
 */
const safeDeleteFile = async (filePath: string): Promise<boolean> => {
  try {
    await storage.file(filePath).delete();
    console.log(`[Cleanup] Deleted file: ${filePath}`);
    return true;
  } catch (error: unknown) {
    const storageError = error as StorageError;
    // Ignorer si le fichier n'existe pas (déjà supprimé)
    if (storageError.code === 404) {
      console.log(`[Cleanup] File not found (already deleted): ${filePath}`);
      return true;
    }
    console.error(`[Cleanup] Error deleting file ${filePath}:`, storageError.message);
    return false;
  }
};

/**
 * Supprime une liste de fichiers en parallèle avec gestion d'erreurs
 *
 * @param filePaths - Liste des chemins de fichiers
 * @returns Objet avec le nombre de succès et d'erreurs
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

/**
 * Nettoyage automatique des médias expirés
 *
 * S'exécute toutes les 5 minutes via Cloud Scheduler.
 * Parcourt toutes les sessions actives et supprime les médias
 * dont le timestamp d'expiration est dépassé.
 *
 * Les messages sont mis à jour avec:
 * - mediaUrl: null
 * - mediaThumbnail: null
 * - mediaExpiresAt: null
 * - content: "[Média expiré]"
 */
export const cleanupExpiredMedia = functions
  .region(REGION)
  .runWith({
    timeoutSeconds: 300, // 5 minutes max
    memory: "512MB",
  })
  .pubsub.schedule("every 5 minutes")
  .onRun(async () => {
    console.log("[Cleanup] Starting expired media cleanup...");
    console.log(`[Cleanup] Execution time: ${new Date().toISOString()}`);

    const now = admin.firestore.Timestamp.now();
    let totalDeleted = 0;
    let totalErrors = 0;
    let sessionsProcessed = 0;

    try {
      // Récupérer toutes les sessions actives ou en attente
      const sessionsSnapshot = await db
        .collection("sessions")
        .where("status", "in", ["waiting", "active"])
        .get();

      console.log(`[Cleanup] Found ${sessionsSnapshot.size} active sessions`);

      // Traiter chaque session
      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionCode = sessionDoc.id;

        // Récupérer les messages avec médias expirés dans cette session
        const expiredMessagesSnapshot = await db
          .collection("sessions")
          .doc(sessionCode)
          .collection("messages")
          .where("mediaExpiresAt", "!=", null)
          .where("mediaExpiresAt", "<", now)
          .get();

        if (expiredMessagesSnapshot.empty) {
          continue; // Pas de médias expirés dans cette session
        }

        console.log(
          `[Cleanup] Found ${expiredMessagesSnapshot.size} expired media in session ${sessionCode}`
        );

        sessionsProcessed++;

        // Collecter les chemins des fichiers à supprimer
        const filesToDelete: string[] = [];

        // Préparer le batch Firestore
        const batch = db.batch();

        for (const messageDoc of expiredMessagesSnapshot.docs) {
          const message = messageDoc.data();

          // Collecter le chemin du média principal
          if (message.mediaUrl) {
            const storagePath = extractStoragePathFromUrl(message.mediaUrl);
            if (storagePath) {
              filesToDelete.push(storagePath);
            }
          }

          // Collecter le chemin du thumbnail si présent
          if (message.mediaThumbnail) {
            const thumbnailPath = extractStoragePathFromUrl(message.mediaThumbnail);
            if (thumbnailPath) {
              filesToDelete.push(thumbnailPath);
            }
          }

          // Mettre à jour le message pour indiquer l'expiration
          batch.update(messageDoc.ref, {
            mediaUrl: null,
            mediaThumbnail: null,
            mediaExpiresAt: null,
            content: "[Média expiré]",
          });
        }

        // Supprimer les fichiers de Storage en parallèle
        const deleteResults = await deleteFilesInParallel(filesToDelete);
        totalDeleted += deleteResults.success;
        totalErrors += deleteResults.errors;

        // Commit les mises à jour Firestore
        await batch.commit();

        console.log(
          `[Cleanup] Session ${sessionCode}: ${deleteResults.success} files deleted, ${deleteResults.errors} errors`
        );
      }

      console.log(
        `[Cleanup] Completed. Sessions: ${sessionsProcessed}, Deleted: ${totalDeleted}, Errors: ${totalErrors}`
      );

      return null;
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[Cleanup] Fatal error during cleanup:", err.message);
      throw error; // Relancer pour que Cloud Functions enregistre l'échec
    }
  });

// ============================================================
// FONCTION 2 : Nettoyage à la fin de session (trigger Firestore)
// ============================================================

/**
 * Nettoyage automatique quand une session se termine
 *
 * Déclenché quand le statut d'une session passe de "active"/"waiting"
 * à "completed" ou "abandoned".
 *
 * Supprime :
 * 1. Tous les fichiers médias dans Storage
 * 2. Tous les messages de la sous-collection
 */
export const onSessionCompleted = functions
  .region(REGION)
  .runWith({
    timeoutSeconds: 120, // 2 minutes max
    memory: "256MB",
  })
  .firestore.document("sessions/{sessionCode}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const sessionCode = context.params.sessionCode;

    // Vérifier si la session vient de se terminer
    const wasActive = before?.status === "active" || before?.status === "waiting";
    const isEnded = after?.status === "completed" || after?.status === "abandoned";

    if (!wasActive || !isEnded) {
      return null; // Pas de changement pertinent
    }

    console.log(`[Cleanup] Session ${sessionCode} ended with status: ${after?.status}`);
    console.log(`[Cleanup] Starting cleanup for session ${sessionCode}...`);

    let filesDeleted = 0;
    let messagesDeleted = 0;

    try {
      // ============================================================
      // ÉTAPE 1 : Supprimer tous les fichiers média de Storage
      // ============================================================

      const mediaPrefix = `${MEDIA_PATH_PREFIX}/${sessionCode}/media/`;

      try {
        const [files] = await storage.getFiles({ prefix: mediaPrefix });

        if (files.length > 0) {
          console.log(`[Cleanup] Found ${files.length} files in Storage`);

          // Supprimer chaque fichier
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
        // Continuer avec la suppression des messages même si Storage échoue
      }

      // ============================================================
      // ÉTAPE 2 : Supprimer tous les messages de la sous-collection
      // ============================================================

      const messagesSnapshot = await db
        .collection("sessions")
        .doc(sessionCode)
        .collection("messages")
        .get();

      if (!messagesSnapshot.empty) {
        console.log(`[Cleanup] Found ${messagesSnapshot.size} messages to delete`);

        // Supprimer par batch (max 500 opérations par batch)
        const batches: admin.firestore.WriteBatch[] = [];
        let currentBatch = db.batch();
        let operationCount = 0;

        for (const doc of messagesSnapshot.docs) {
          currentBatch.delete(doc.ref);
          operationCount++;

          // Créer un nouveau batch si on atteint la limite
          if (operationCount === BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            operationCount = 0;
          }
        }

        // Ajouter le dernier batch s'il contient des opérations
        if (operationCount > 0) {
          batches.push(currentBatch);
        }

        // Exécuter tous les batches en parallèle
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
  });

// ============================================================
// FONCTION 3 : Nettoyage manuel (callable pour debug/admin)
// ============================================================

/**
 * Interface des données d'entrée pour le nettoyage manuel
 */
interface ManualCleanupData {
  /** Code de session spécifique (optionnel) */
  sessionCode?: string;
  /** Forcer la suppression même si la session est active */
  force?: boolean;
}

/**
 * Interface de la réponse du nettoyage manuel
 */
interface ManualCleanupResponse {
  success: boolean;
  message: string;
  filesDeleted?: number;
  messagesDeleted?: number;
}

/**
 * Fonction de nettoyage manuel
 *
 * Permet aux admins de déclencher un nettoyage:
 * - D'une session spécifique (avec sessionCode)
 * - Ou de forcer l'exécution du nettoyage global
 *
 * Requiert une authentification.
 */
export const manualCleanup = functions
  .region(REGION)
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB",
  })
  .https.onCall(
    async (data: ManualCleanupData, context): Promise<ManualCleanupResponse> => {
      // Vérifier l'authentification
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Authentification requise pour cette opération"
        );
      }

      const uid = context.auth.uid;
      console.log(`[ManualCleanup] Called by user: ${uid}`);

      // TODO: Ajouter une vérification admin ici si nécessaire
      // const isAdmin = await checkIfAdmin(uid);
      // if (!isAdmin) throw new functions.https.HttpsError("permission-denied", "...");

      const { sessionCode, force = false } = data;

      try {
        if (sessionCode) {
          // ============================================================
          // Nettoyer une session spécifique
          // ============================================================

          console.log(`[ManualCleanup] Cleaning session: ${sessionCode}`);

          // Vérifier que la session existe
          const sessionDoc = await db.collection("sessions").doc(sessionCode).get();

          if (!sessionDoc.exists) {
            return {
              success: false,
              message: `Session ${sessionCode} introuvable`,
            };
          }

          const sessionData = sessionDoc.data();

          // Empêcher la suppression des sessions actives sauf si force=true
          if (!force && (sessionData?.status === "active" || sessionData?.status === "waiting")) {
            return {
              success: false,
              message: `La session ${sessionCode} est encore active. Utilisez force=true pour forcer la suppression.`,
            };
          }

          // Supprimer les fichiers Storage
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

          // Supprimer les messages
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
          // ============================================================
          // Déclencher un nettoyage global
          // ============================================================

          console.log("[ManualCleanup] Global cleanup requested");

          // Note: On ne peut pas appeler directement la scheduled function
          // On peut simuler son comportement ici si nécessaire

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
        throw new functions.https.HttpsError(
          "internal",
          `Erreur lors du nettoyage: ${err.message}`
        );
      }
    }
  );

// ============================================================
// FONCTION BONUS : Statistiques de stockage (pour monitoring)
// ============================================================

/**
 * Interface de réponse des statistiques
 */
interface StorageStatsResponse {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  totalMediaFiles: number;
  expiredMediaCount: number;
  storageUsedMB: number;
}

/**
 * Récupère les statistiques de stockage
 *
 * Utile pour le monitoring et le debugging.
 * Requiert une authentification.
 */
export const getStorageStats = functions
  .region(REGION)
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .https.onCall(async (_data, context): Promise<StorageStatsResponse> => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentification requise"
      );
    }

    console.log("[Stats] Computing storage statistics...");

    try {
      const now = admin.firestore.Timestamp.now();

      // Compter les sessions
      const allSessions = await db.collection("sessions").get();
      const activeSessions = await db
        .collection("sessions")
        .where("status", "in", ["waiting", "active"])
        .get();

      // Compter les messages avec médias expirés
      let totalMessages = 0;
      let expiredMediaCount = 0;

      for (const sessionDoc of allSessions.docs) {
        const messagesSnapshot = await db
          .collection("sessions")
          .doc(sessionDoc.id)
          .collection("messages")
          .get();

        totalMessages += messagesSnapshot.size;

        // Compter les médias expirés
        messagesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.mediaExpiresAt && data.mediaExpiresAt.toDate() < now.toDate()) {
            expiredMediaCount++;
          }
        });
      }

      // Compter les fichiers Storage
      const [files] = await storage.getFiles({ prefix: MEDIA_PATH_PREFIX });

      // Calculer la taille totale (approximative)
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
      throw new functions.https.HttpsError(
        "internal",
        `Erreur: ${err.message}`
      );
    }
  });