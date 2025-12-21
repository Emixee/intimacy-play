/**
 * Service d'authentification Firebase
 *
 * Gère toutes les opérations d'authentification :
 * - Inscription avec création de document Firestore
 * - Connexion avec mise à jour lastLogin
 * - Déconnexion
 * - Réinitialisation de mot de passe
 * - Listener d'état d'authentification
 */

import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  auth,
  firestore,
  serverTimestamp,
  toTimestamp,
  usersCollection,
} from "../config/firebase";
import {
  User,
  RegisterCredentials,
  LoginCredentials,
  ApiResponse,
} from "../types";

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Erreurs d'email
  "auth/email-already-in-use": "Cette adresse email est déjà utilisée",
  "auth/invalid-email": "Adresse email invalide",
  "auth/user-not-found": "Aucun compte associé à cette adresse email",

  // Erreurs de mot de passe
  "auth/wrong-password": "Mot de passe incorrect",
  "auth/weak-password": "Mot de passe trop faible (minimum 6 caractères)",

  // Erreurs de compte
  "auth/user-disabled": "Ce compte a été désactivé",
  "auth/account-exists-with-different-credential":
    "Un compte existe déjà avec cette adresse email",

  // Erreurs réseau
  "auth/network-request-failed": "Erreur de connexion. Vérifiez votre réseau",
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard",

  // Erreurs générales
  "auth/operation-not-allowed": "Opération non autorisée",
  "auth/requires-recent-login": "Veuillez vous reconnecter pour continuer",
};

/**
 * Convertit un code d'erreur Firebase en message français
 */
const getAuthErrorMessage = (errorCode: string): string => {
  return AUTH_ERROR_MESSAGES[errorCode] || "Une erreur est survenue";
};

// ============================================================
// SERVICE D'AUTHENTIFICATION
// ============================================================

export const authService = {
  // ----------------------------------------------------------
  // INSCRIPTION
  // ----------------------------------------------------------

  /**
   * Inscrit un nouvel utilisateur
   * 1. Crée le compte Firebase Auth
   * 2. Envoie l'email de vérification
   * 3. Crée le document utilisateur dans Firestore
   *
   * @param credentials - Email, password, displayName, gender, dateOfBirth
   * @returns ApiResponse avec l'utilisateur Firebase
   */
  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<FirebaseAuthTypes.User>> {
    const { email, password, displayName, gender, dateOfBirth } = credentials;

    try {
      // 1. Créer le compte Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2. Envoyer l'email de vérification
      await firebaseUser.sendEmailVerification();

      // 3. Mettre à jour le displayName dans Firebase Auth
      await firebaseUser.updateProfile({ displayName });

      // 4. Créer le document utilisateur dans Firestore
      const userData: Omit<User, "id"> = {
        email,
        displayName,
        gender,
        dateOfBirth: toTimestamp(dateOfBirth),
        premium: false,
        premiumUntil: null,
        premiumPlan: null,
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
        notificationsEnabled: true,
        fcmToken: null,
      };

      await usersCollection().doc(firebaseUser.uid).set(userData);

      return {
        success: true,
        data: firebaseUser,
      };
    } catch (error: any) {
      console.error("[AuthService] Register error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // CONNEXION
  // ----------------------------------------------------------

  /**
   * Connecte un utilisateur existant
   * Met à jour le champ lastLogin dans Firestore
   *
   * @param credentials - Email et password
   * @returns ApiResponse avec l'utilisateur Firebase
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<FirebaseAuthTypes.User>> {
    const { email, password } = credentials;

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 2. Mettre à jour lastLogin dans Firestore
      await usersCollection().doc(firebaseUser.uid).update({
        lastLogin: serverTimestamp(),
      });

      return {
        success: true,
        data: firebaseUser,
      };
    } catch (error: any) {
      console.error("[AuthService] Login error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // DÉCONNEXION
  // ----------------------------------------------------------

  /**
   * Déconnecte l'utilisateur courant
   *
   * @returns ApiResponse void
   */
  async logout(): Promise<ApiResponse> {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Logout error:", error);
      return {
        success: false,
        error: "Erreur lors de la déconnexion",
      };
    }
  },

  // ----------------------------------------------------------
  // RÉINITIALISATION DE MOT DE PASSE
  // ----------------------------------------------------------

  /**
   * Envoie un email de réinitialisation de mot de passe
   *
   * @param email - Adresse email de l'utilisateur
   * @returns ApiResponse void
   */
  async resetPassword(email: string): Promise<ApiResponse> {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Reset password error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // RENVOYER L'EMAIL DE VÉRIFICATION
  // ----------------------------------------------------------

  /**
   * Renvoie l'email de vérification à l'utilisateur courant
   *
   * @returns ApiResponse void
   */
  async resendVerificationEmail(): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: "Aucun utilisateur connecté",
        };
      }

      await currentUser.sendEmailVerification();
      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Resend verification error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // LISTENER D'ÉTAT D'AUTHENTIFICATION
  // ----------------------------------------------------------

  /**
   * S'abonne aux changements d'état d'authentification
   *
   * @param callback - Fonction appelée à chaque changement
   * @returns Fonction de désinscription
   */
  onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void
  ): () => void {
    return auth().onAuthStateChanged(callback);
  },

  // ----------------------------------------------------------
  // UTILISATEUR COURANT
  // ----------------------------------------------------------

  /**
   * Récupère l'utilisateur Firebase courant
   *
   * @returns L'utilisateur Firebase ou null
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  },

  /**
   * Vérifie si un utilisateur est connecté
   *
   * @returns true si connecté, false sinon
   */
  isLoggedIn(): boolean {
    return auth().currentUser !== null;
  },

  // ----------------------------------------------------------
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Récupère les données utilisateur depuis Firestore
   *
   * @param userId - UID de l'utilisateur
   * @returns ApiResponse avec les données User
   */
  async getUserData(userId: string): Promise<ApiResponse<User>> {
    try {
      const doc = await usersCollection().doc(userId).get();

      if (!doc.exists) {
        return {
          success: false,
          error: "Utilisateur introuvable",
        };
      }

      const userData = {
        id: doc.id,
        ...doc.data(),
      } as User;

      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      console.error("[AuthService] Get user data error:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des données",
      };
    }
  },

  /**
   * S'abonne aux changements des données utilisateur
   *
   * @param userId - UID de l'utilisateur
   * @param callback - Fonction appelée à chaque changement
   * @returns Fonction de désinscription
   */
  onUserDataChanged(
    userId: string,
    callback: (userData: User | null) => void
  ): () => void {
    return usersCollection()
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const userData = {
              id: doc.id,
              ...doc.data(),
            } as User;
            callback(userData);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error("[AuthService] User data listener error:", error);
          callback(null);
        }
      );
  },

  // ----------------------------------------------------------
  // MISE À JOUR DU PROFIL
  // ----------------------------------------------------------

  /**
   * Met à jour les données utilisateur dans Firestore
   *
   * @param userId - UID de l'utilisateur
   * @param data - Données à mettre à jour
   * @returns ApiResponse void
   */
  async updateUserData(
    userId: string,
    data: Partial<Omit<User, "id" | "email" | "createdAt">>
  ): Promise<ApiResponse> {
    try {
      await usersCollection().doc(userId).update(data);
      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Update user data error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du profil",
      };
    }
  },

  /**
   * Met à jour le token FCM pour les notifications push
   *
   * @param userId - UID de l'utilisateur
   * @param token - Token FCM
   * @returns ApiResponse void
   */
  async updateFcmToken(userId: string, token: string): Promise<ApiResponse> {
    try {
      await usersCollection().doc(userId).update({
        fcmToken: token,
      });
      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Update FCM token error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du token",
      };
    }
  },

  // ----------------------------------------------------------
  // SUPPRESSION DE COMPTE
  // ----------------------------------------------------------

  /**
   * Supprime le compte utilisateur
   * 1. Supprime le document Firestore
   * 2. Supprime le compte Firebase Auth
   *
   * @returns ApiResponse void
   */
  async deleteAccount(): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: "Aucun utilisateur connecté",
        };
      }

      // 1. Supprimer le document Firestore
      await usersCollection().doc(currentUser.uid).delete();

      // 2. Supprimer le compte Firebase Auth
      await currentUser.delete();

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Delete account error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default authService;