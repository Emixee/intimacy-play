/**
 * Configuration Firebase
 * 
 * Avec @react-native-firebase, la configuration est automatiquement
 * lue depuis google-services.json (Android).
 */

import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore, { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

// ============================================================
// EXPORTS DES INSTANCES
// ============================================================

export { auth, firestore };

// ============================================================
// TYPES RÉ-EXPORTÉS
// ============================================================

export type { FirebaseAuthTypes, FirebaseFirestoreTypes };

// ============================================================
// HELPERS
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

// ============================================================
// RÉFÉRENCES DES COLLECTIONS
// ============================================================

export const usersCollection = () => firestore().collection("users");
export const sessionsCollection = () => firestore().collection("sessions");

// ============================================================
// VÉRIFICATION DE CONNEXION
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