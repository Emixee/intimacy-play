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
 * - Messaging : Notifications push (FCM)
 */

import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import storage, { FirebaseStorageTypes } from "@react-native-firebase/storage";
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

// ============================================================
// EXPORTS DES INSTANCES
// ============================================================

export { auth, firestore, storage, messaging };

// ============================================================
// TYPES RÉ-EXPORTÉS
// ============================================================

export type { FirebaseAuthTypes, FirebaseFirestoreTypes, FirebaseStorageTypes, FirebaseMessagingTypes };

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
// HELPERS MESSAGING (FCM)
// ============================================================

/**
 * Demande la permission pour les notifications
 * @returns true si autorisé
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
};

/**
 * Récupère le token FCM de l'appareil
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error("Erreur récupération FCM token:", error);
    return null;
  }
};

/**
 * S'abonne à un topic FCM
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  await messaging().subscribeToTopic(topic);
};

/**
 * Se désabonne d'un topic FCM
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  await messaging().unsubscribeFromTopic(topic);
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