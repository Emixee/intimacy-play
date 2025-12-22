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
export declare const cleanupExpiredMedia: functions.CloudFunction<unknown>;
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
export declare const onSessionCompleted: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
/**
 * Fonction de nettoyage manuel
 *
 * Permet aux admins de déclencher un nettoyage:
 * - D'une session spécifique (avec sessionCode)
 * - Ou de forcer l'exécution du nettoyage global
 *
 * Requiert une authentification.
 */
export declare const manualCleanup: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Récupère les statistiques de stockage
 *
 * Utile pour le monitoring et le debugging.
 * Requiert une authentification.
 */
export declare const getStorageStats: functions.HttpsFunction & functions.Runnable<any>;
