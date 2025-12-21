/**
 * Service d'authentification Firebase
 *
 * Gère toutes les opérations d'authentification :
 * - Inscription avec création de document Firestore
 * - Connexion avec mise à jour lastLogin
 * - Déconnexion
 * - Réinitialisation de mot de passe
 * - Listener d'état d'authentification
 *
 * ⚠️ IMPORTANT: Le document utilisateur doit inclure le champ 'preferences'
 * car il est requis par les règles de sécurité Firestore.
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
  UserPreferences,
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
// PRÉFÉRENCES PAR DÉFAUT
// ============================================================

/**
 * Préférences utilisateur par défaut pour les nouveaux comptes
 * - Thèmes gratuits uniquement (romantic, sensual)
 * - Pas de jouets
 * - Tous les types de médias acceptés
 * - Langue française
 */
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themes: ["romantic", "sensual"], // Thèmes gratuits par défaut
  toys: [], // Pas de jouets par défaut
  mediaPreferences: {
    photo: true,
    audio: true,
    video: true,
  },
  language: "fr",
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
   * 3. Crée le document utilisateur dans Firestore (avec preferences)
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
      // ⚠️ IMPORTANT: Le champ 'preferences' est REQUIS par les règles Firestore
      const userData: Omit<User, "id"> = {
        email,
        displayName,
        gender,
        dateOfBirth: toTimestamp(dateOfBirth),
        // Couple (null par défaut)
        coupleId: null,
        partnerNickname: null,
        // Premium (false par défaut)
        premium: false,
        premiumUntil: null,
        premiumPlan: null,
        // Préférences (REQUIS par les règles Firestore)
        preferences: DEFAULT_USER_PREFERENCES,
        // Timestamps
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
        // Notifications
        notificationsEnabled: true,
        fcmToken: null,
      };

      await usersCollection().doc(firebaseUser.uid).set(userData);

      console.log("[AuthService] User registered successfully:", firebaseUser.uid);

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

      console.log("[AuthService] User logged in:", firebaseUser.uid);

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
      console.log("[AuthService] User logged out");
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
      console.log("[AuthService] Password reset email sent to:", email);
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
  // RENVOI EMAIL DE VÉRIFICATION
  // ----------------------------------------------------------

  /**
   * Renvoie l'email de vérification à l'utilisateur connecté
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
      console.log("[AuthService] Verification email resent");
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
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Récupère les données utilisateur depuis Firestore
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse avec les données utilisateur
   */
  async getUserData(uid: string): Promise<ApiResponse<User>> {
    try {
      const doc = await usersCollection().doc(uid).get();

      if (!doc.exists) {
        return {
          success: false,
          error: "Profil utilisateur introuvable",
        };
      }

      const userData: User = {
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
        error: "Erreur lors de la récupération du profil",
      };
    }
  },

  // ----------------------------------------------------------
  // LISTENERS
  // ----------------------------------------------------------

  /**
   * Écoute les changements d'état d'authentification
   *
   * @param callback - Fonction appelée à chaque changement
   * @returns Fonction de désinscription
   */
  onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void
  ): () => void {
    return auth().onAuthStateChanged(callback);
  },

  /**
   * Écoute les changements des données utilisateur dans Firestore
   *
   * @param uid - UID de l'utilisateur
   * @param callback - Fonction appelée à chaque changement
   * @returns Fonction de désinscription
   */
  onUserDataChanged(
    uid: string,
    callback: (user: User | null) => void
  ): () => void {
    return usersCollection()
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const userData: User = {
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
  // UTILITAIRES
  // ----------------------------------------------------------

  /**
   * Récupère l'utilisateur Firebase actuellement connecté
   *
   * @returns Utilisateur Firebase ou null
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  },

  /**
   * Vérifie si un utilisateur est connecté
   *
   * @returns true si connecté, false sinon
   */
  isAuthenticated(): boolean {
    return auth().currentUser !== null;
  },

  // ----------------------------------------------------------
  // SUPPRESSION DE COMPTE (RGPD)
  // ----------------------------------------------------------

  /**
   * Supprime le compte utilisateur (Firebase Auth + Firestore)
   * Conformité RGPD
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

      const uid = currentUser.uid;

      // 1. Supprimer le document Firestore
      await usersCollection().doc(uid).delete();

      // 2. Supprimer le compte Firebase Auth
      await currentUser.delete();

      console.log("[AuthService] Account deleted:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Delete account error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DE MOT DE PASSE
  // ----------------------------------------------------------

  /**
   * Met à jour le mot de passe de l'utilisateur connecté
   *
   * @param newPassword - Nouveau mot de passe
   * @returns ApiResponse void
   */
  async updatePassword(newPassword: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: "Aucun utilisateur connecté",
        };
      }

      await currentUser.updatePassword(newPassword);
      console.log("[AuthService] Password updated");

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Update password error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DE L'EMAIL
  // ----------------------------------------------------------

  /**
   * Met à jour l'email de l'utilisateur connecté
   * Met également à jour le document Firestore
   *
   * @param newEmail - Nouvel email
   * @returns ApiResponse void
   */
  async updateEmail(newEmail: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: "Aucun utilisateur connecté",
        };
      }

      // 1. Mettre à jour dans Firebase Auth
      await currentUser.updateEmail(newEmail);

      // 2. Envoyer un email de vérification
      await currentUser.sendEmailVerification();

      // Note: Le champ email dans Firestore ne peut pas être modifié
      // selon les règles de sécurité (immutable)

      console.log("[AuthService] Email updated to:", newEmail);

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Update email error:", error);
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