/**
 * Configuration Firebase
 * 
 * Avec @react-native-firebase, la configuration est automatiquement
 * lue depuis google-services.json (Android).
 * 
 * Services disponibles :
 * - Auth : Authentification email/password
 * - Firestore : Base de données temps réel
 * - Storage : Stockage de médias (photos, vidéos, audio)
 * - Messaging : Notifications push (FCM) - CONDITIONNEL (pas dans Expo Go)
 * 
 * CORRECTIF : Import conditionnel de messaging pour éviter crash dans Expo Go
 */

import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage";
import Constants from "expo-constants";

// ============================================================
// MESSAGING CONDITIONNEL
// ============================================================

/**
 * Vérifie si on est dans Expo Go (pas de modules natifs)
 */
const isExpoGo = Constants.appOwnership === "expo";

/**
 * Module messaging chargé dynamiquement
 * Null si dans Expo Go ou si non disponible
 */
let messagingModule: any = null;

// Ne charger messaging que si on n'est PAS dans Expo Go
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    messagingModule = require("@react-native-firebase/messaging").default;
    console.log("[Firebase] Messaging module loaded successfully");
  } catch (error) {
    console.warn("[Firebase] Messaging module not available:", error);
  }
} else {
  console.log("[Firebase] Expo Go detected - Messaging disabled");
}

// ============================================================
// EXPORTS DES INSTANCES
// ============================================================

export { auth, firestore, storage };

// Export messaging uniquement s'il est disponible
export const messaging = messagingModule;

// ============================================================
// TYPES RÉ-EXPORTÉS
// ============================================================

export type { FirebaseAuthTypes, FirebaseFirestoreTypes };

// Type conditionnel pour messaging
export type FirebaseMessagingTypes = any;

// ============================================================
// HELPERS FIRESTORE
// ============================================================

/**
 * Récupère le timestamp serveur Firestore
 */
export const serverTimestamp = () => firestore.FieldValue.serverTimestamp();

/**
 * Crée un timestamp Firestore à partir d'une Date
 */
export const toTimestamp = (date: Date): FirebaseFirestoreTypes.Timestamp => {
  return firestore.Timestamp.fromDate(date);
};

/**
 * Convertit un timestamp Firestore en Date
 */
export const fromTimestamp = (
  timestamp: FirebaseFirestoreTypes.Timestamp | null
): Date | null => {
  return timestamp ? timestamp.toDate() : null;
};

/**
 * Incrémente une valeur numérique
 */
export const increment = (value: number = 1) => firestore.FieldValue.increment(value);

/**
 * Ajoute un élément à un tableau
 */
export const arrayUnion = (...elements: any[]) => firestore.FieldValue.arrayUnion(...elements);

/**
 * Supprime un élément d'un tableau
 */
export const arrayRemove = (...elements: any[]) => firestore.FieldValue.arrayRemove(...elements);

// ============================================================
// RÉFÉRENCES DES COLLECTIONS
// ============================================================

export const usersCollection = () => firestore().collection("users");
export const sessionsCollection = () => firestore().collection("sessions");

// ============================================================
// HELPERS STORAGE
// ============================================================

/**
 * Référence vers un fichier dans Storage
 */
export const storageRef = (path: string) => storage().ref(path);

/**
 * Upload un fichier vers Storage
 * @param path Chemin dans Storage (ex: "sessions/ABC123/media/photo.jpg")
 * @param localUri URI locale du fichier (ex: "file:///...")
 * @returns URL de téléchargement
 */
export const uploadFile = async (path: string, localUri: string): Promise<string> => {
  const reference = storage().ref(path);
  await reference.putFile(localUri);
  return await reference.getDownloadURL();
};

/**
 * Supprime un fichier de Storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    await storage().ref(path).delete();
  } catch (error: any) {
    // Ignorer si le fichier n'existe pas
    if (error.code !== "storage/object-not-found") {
      throw error;
    }
  }
};

/**
 * Génère le chemin de stockage pour un média de session
 */
export const getSessionMediaPath = (
  sessionCode: string, 
  fileName: string
): string => {
  return `sessions/${sessionCode}/media/${fileName}`;
};

// ============================================================
// HELPERS MESSAGING (FCM) - CONDITIONNELS
// ============================================================

/**
 * Vérifie si les notifications sont disponibles
 */
export const isMessagingAvailable = (): boolean => {
  return messagingModule !== null;
};

/**
 * Demande la permission pour les notifications
 * @returns true si autorisé, false si non disponible ou refusé
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!messagingModule) {
    console.log("[Firebase] requestNotificationPermission - messaging not available");
    return false;
  }
  
  try {
    const authStatus = await messagingModule().requestPermission();
    const enabled =
      authStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingModule.AuthorizationStatus.PROVISIONAL;
    return enabled;
  } catch (error) {
    console.error("[Firebase] requestNotificationPermission error:", error);
    return false;
  }
};

/**
 * Récupère le token FCM de l'appareil
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!messagingModule) {
    console.log("[Firebase] getFCMToken - messaging not available");
    return null;
  }
  
  try {
    const token = await messagingModule().getToken();
    return token;
  } catch (error) {
    console.error("[Firebase] getFCMToken error:", error);
    return null;
  }
};

/**
 * S'abonne à un topic FCM
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  if (!messagingModule) {
    console.log("[Firebase] subscribeToTopic - messaging not available");
    return;
  }
  
  try {
    await messagingModule().subscribeToTopic(topic);
  } catch (error) {
    console.error("[Firebase] subscribeToTopic error:", error);
  }
};

/**
 * Se désabonne d'un topic FCM
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  if (!messagingModule) {
    console.log("[Firebase] unsubscribeFromTopic - messaging not available");
    return;
  }
  
  try {
    await messagingModule().unsubscribeFromTopic(topic);
  } catch (error) {
    console.error("[Firebase] unsubscribeFromTopic error:", error);
  }
};

// ============================================================
// HELPERS AUTH
// ============================================================

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isUserLoggedIn = (): boolean => {
  return auth().currentUser !== null;
};

/**
 * Récupère l'utilisateur courant
 */
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

/**
 * Récupère l'UID de l'utilisateur courant
 */
export const getCurrentUserId = (): string | null => {
  return auth().currentUser?.uid ?? null;
};

/**
 * Récupère l'email de l'utilisateur courant
 */
export const getCurrentUserEmail = (): string | null => {
  return auth().currentUser?.email ?? null;
};