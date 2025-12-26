/**
 * Service d'authentification Firebase - VERSION CORRIGÉE
 *
 * FIX: La mise à jour de lastLogin ne bloque plus le login
 * FIX: Meilleurs messages d'erreur avec détails
 */

import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  auth,
  serverTimestamp,
  toTimestamp,
  usersCollection,
  sessionsCollection,
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
  "auth/invalid-credential": "Email ou mot de passe incorrect",

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

  // Erreur personnalisée
  "auth/underage": "Vous devez avoir au moins 18 ans pour utiliser cette application",
};

/**
 * Convertit un code d'erreur Firebase en message français
 */
const getAuthErrorMessage = (errorCode: string): string => {
  return AUTH_ERROR_MESSAGES[errorCode] || `Erreur: ${errorCode || "inconnue"}`;
};

// ============================================================
// PRÉFÉRENCES PAR DÉFAUT
// ============================================================

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themes: ["classique"],
  toys: [],
  mediaPreferences: {
    photo: true,
    audio: true,
    video: true,
  },
  language: "fr",
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const isAdult = (dateOfBirth: Date): boolean => {
  return calculateAge(dateOfBirth) >= 18;
};

// ============================================================
// SERVICE D'AUTHENTIFICATION
// ============================================================

export const authService = {
  // ----------------------------------------------------------
  // INSCRIPTION
  // ----------------------------------------------------------

  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<FirebaseAuthTypes.User>> {
    const { email, password, displayName, gender, dateOfBirth } = credentials;

    try {
      // 1. Vérification de l'âge (18+)
      if (!isAdult(dateOfBirth)) {
        console.log("[AuthService] Registration rejected: user is under 18");
        return {
          success: false,
          error: getAuthErrorMessage("auth/underage"),
          code: "auth/underage",
        };
      }

      // 2. Créer le compte Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 3. Envoyer l'email de vérification
      await firebaseUser.sendEmailVerification();

      // 4. Mettre à jour le displayName dans Firebase Auth
      await firebaseUser.updateProfile({ displayName });

      // 5. Créer le document utilisateur dans Firestore
      const userData: Omit<User, "id"> = {
        email,
        displayName,
        gender,
        dateOfBirth: toTimestamp(dateOfBirth),
        premium: false,
        premiumUntil: null,
        premiumPlan: null,
        preferences: DEFAULT_USER_PREFERENCES,
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
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
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // CONNEXION - VERSION CORRIGÉE
  // ----------------------------------------------------------

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<FirebaseAuthTypes.User>> {
    const { email, password } = credentials;

    try {
      console.log("[AuthService] Attempting login for:", email);
      
      // 1. Connexion Firebase Auth
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );
      const firebaseUser = userCredential.user;
      
      console.log("[AuthService] Firebase Auth successful:", firebaseUser.uid);

      // 2. Mettre à jour lastLogin dans Firestore
      // FIX: Ne PAS bloquer le login si cette mise à jour échoue
      try {
        await usersCollection().doc(firebaseUser.uid).update({
          lastLogin: serverTimestamp(),
        });
        console.log("[AuthService] lastLogin updated");
      } catch (updateError: any) {
        // Log l'erreur mais continue quand même
        console.warn("[AuthService] Failed to update lastLogin (non-blocking):", updateError.code || updateError.message);
      }

      console.log("[AuthService] Login successful for:", firebaseUser.uid);

      return {
        success: true,
        data: firebaseUser,
      };
    } catch (error: any) {
      console.error("[AuthService] Login error:", error.code, error.message);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // DÉCONNEXION
  // ----------------------------------------------------------

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
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // RENVOI EMAIL DE VÉRIFICATION
  // ----------------------------------------------------------

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
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ----------------------------------------------------------

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

  onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void
  ): () => void {
    return auth().onAuthStateChanged(callback);
  },

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

  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  },

  isAuthenticated(): boolean {
    return auth().currentUser !== null;
  },

  // ----------------------------------------------------------
  // SUPPRESSION DE COMPTE (RGPD)
  // ----------------------------------------------------------

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
      console.log("[AuthService] Starting RGPD account deletion for:", uid);

      // 1. Supprimer les sessions où l'utilisateur est créateur
      const creatorSessionsSnapshot = await sessionsCollection()
        .where("creatorId", "==", uid)
        .get();

      for (const sessionDoc of creatorSessionsSnapshot.docs) {
        const messagesSnapshot = await sessionDoc.ref.collection("messages").get();
        for (const messageDoc of messagesSnapshot.docs) {
          await messageDoc.ref.delete();
        }
        await sessionDoc.ref.delete();
        console.log("[AuthService] Deleted session (creator):", sessionDoc.id);
      }

      // 2. Supprimer les sessions où l'utilisateur est partenaire
      const partnerSessionsSnapshot = await sessionsCollection()
        .where("partnerId", "==", uid)
        .get();

      for (const sessionDoc of partnerSessionsSnapshot.docs) {
        const messagesSnapshot = await sessionDoc.ref.collection("messages").get();
        for (const messageDoc of messagesSnapshot.docs) {
          await messageDoc.ref.delete();
        }
        await sessionDoc.ref.delete();
        console.log("[AuthService] Deleted session (partner):", sessionDoc.id);
      }

      // 3. Supprimer le document utilisateur Firestore
      await usersCollection().doc(uid).delete();
      console.log("[AuthService] Deleted user document:", uid);

      // 4. Supprimer le compte Firebase Auth
      await currentUser.delete();
      console.log("[AuthService] Deleted Firebase Auth account:", uid);

      console.log("[AuthService] RGPD deletion completed for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Delete account error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR MOT DE PASSE
  // ----------------------------------------------------------

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
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR EMAIL
  // ----------------------------------------------------------

  async updateEmail(newEmail: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: "Aucun utilisateur connecté",
        };
      }

      await currentUser.updateEmail(newEmail);
      await currentUser.sendEmailVerification();

      console.log("[AuthService] Email updated to:", newEmail);

      return { success: true };
    } catch (error: any) {
      console.error("[AuthService] Update email error:", error);
      return {
        success: false,
        error: getAuthErrorMessage(error.code),
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // UTILITAIRES PUBLICS
  // ----------------------------------------------------------

  isAdult(dateOfBirth: Date): boolean {
    return isAdult(dateOfBirth);
  },

  calculateAge(dateOfBirth: Date): number {
    return calculateAge(dateOfBirth);
  },
};

export default authService;
