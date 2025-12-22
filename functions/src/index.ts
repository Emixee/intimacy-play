/**
 * Point d'entrée des Cloud Functions - Intimacy Play
 *
 * Firebase Functions v2 pour Node.js 20
 *
 * Déploiement complet :
 * cd functions
 * npm install
 * npm run build
 * firebase deploy --only functions
 *
 * Déploiement individuel :
 * firebase deploy --only functions:cleanupExpiredMedia
 * firebase deploy --only functions:onSessionCompleted
 * firebase deploy --only functions:manualCleanup
 * firebase deploy --only functions:getStorageStats
 */

// ============================================================
// NETTOYAGE DES MÉDIAS
// ============================================================

export {
  /**
   * Nettoyage automatique des médias expirés
   * S'exécute toutes les 5 minutes via Cloud Scheduler
   * Supprime les médias dont mediaExpiresAt < now
   */
  cleanupExpiredMedia,

  /**
   * Nettoyage à la fin d'une session
   * Trigger Firestore sur update de sessions/{sessionCode}
   * Se déclenche quand status passe à "completed" ou "abandoned"
   */
  onSessionCompleted,

  /**
   * Nettoyage manuel (pour debug/admin)
   * Callable function - requiert authentification
   * Peut nettoyer une session spécifique ou déclencher un nettoyage global
   */
  manualCleanup,

  /**
   * Statistiques de stockage
   * Callable function - requiert authentification
   * Retourne des stats sur les sessions, messages et fichiers Storage
   */
  getStorageStats,
} from "./cleanupExpiredMedia";

// ============================================================
// À AJOUTER PLUS TARD
// ============================================================

// Notifications Push
// export { sendPushNotification, onNewMessage, onSessionInvite } from "./notifications";

// Statistiques et Analytics
// export { computeDailyStats, computeWeeklyReport } from "./analytics";

// Gestion Premium / Paiements
// export { onPurchaseComplete, checkPremiumStatus } from "./premium";

// Modération
// export { reportContent, autoModerateMessage } from "./moderation";