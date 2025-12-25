/**
 * Service de gestion des utilisateurs Firestore
 *
 * PROMPT PROFILE-EDIT : Ajout des méthodes pour modifier email et genre
 *
 * Gère toutes les opérations liées aux profils utilisateurs :
 * - CRUD des documents utilisateurs
 * - Modification de l'email (Firebase Auth + Firestore)
 * - Modification du genre
 * - Écoute temps réel des profils
 * - Gestion des abonnements Premium
 * - Mise à jour des préférences
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { auth } from "../config/firebase";
import {
  serverTimestamp,
  toTimestamp,
  usersCollection,
} from "../config/firebase";
import {
  User,
  CreateUserData,
  PremiumPlan,
  ApiResponse,
  Gender,
  DEFAULT_USER_PREFERENCES,
} from "../types";

// ============================================================
// TYPES SPÉCIFIQUES AU SERVICE
// ============================================================

export interface UpdateUserData {
  displayName?: string;
  gender?: Gender;
  dateOfBirth?: Date;
  notificationsEnabled?: boolean;
  fcmToken?: string | null;
}

export interface PremiumUpdateData {
  premium: boolean;
  premiumPlan: PremiumPlan | null;
  premiumUntil: Date | null;
}

// ============================================================
// MESSAGES D'ERREUR EN FRANÇAIS
// ============================================================

const USER_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Cette adresse email est déjà utilisée",
  "auth/invalid-email": "Adresse email invalide",
  "auth/requires-recent-login": "Veuillez vous reconnecter pour modifier l'email",
  "auth/operation-not-allowed": "Opération non autorisée",
  "firestore/not-found": "Profil utilisateur introuvable",
  "firestore/permission-denied": "Vous n'avez pas la permission de modifier ce profil",
};

const getErrorMessage = (errorCode: string): string => {
  return USER_ERROR_MESSAGES[errorCode] || "Une erreur est survenue";
};

// ============================================================
// SERVICE UTILISATEUR
// ============================================================

export const userService = {
  // ----------------------------------------------------------
  // CRÉATION DE DOCUMENT UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Crée un nouveau document utilisateur dans Firestore
   * Utilisé après la création du compte Firebase Auth
   *
   * @param uid - UID de l'utilisateur Firebase Auth
   * @param data - Données du profil utilisateur
   * @returns ApiResponse avec les données utilisateur créées
   */
  async createUserDocument(
    uid: string,
    data: CreateUserData
  ): Promise<ApiResponse<User>> {
    try {
      const newUserDoc: Omit<User, "id"> = {
        email: data.email,
        displayName: data.displayName,
        gender: data.gender,
        dateOfBirth: toTimestamp(data.dateOfBirth),
        // Premium
        premium: false,
        premiumUntil: null,
        premiumPlan: null,
        // Préférences (REQUIS par les règles Firestore)
        preferences: DEFAULT_USER_PREFERENCES,
        // Timestamps
        createdAt: serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        lastLogin: serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        // Notifications
        notificationsEnabled: true,
        fcmToken: null,
      };

      await usersCollection().doc(uid).set(newUserDoc);

      // Récupérer le document créé pour retourner les données complètes
      const createdDoc = await usersCollection().doc(uid).get();
      const userData = {
        id: createdDoc.id,
        ...createdDoc.data(),
      } as User;

      console.log("[UserService] Document created for:", uid);

      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      console.error("[UserService] Create document error:", error);
      return {
        success: false,
        error: "Erreur lors de la création du profil",
      };
    }
  },

  // ----------------------------------------------------------
  // RÉCUPÉRATION DE DOCUMENT UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Récupère le document utilisateur depuis Firestore
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse avec les données User
   */
  async getUserDocument(uid: string): Promise<ApiResponse<User>> {
    try {
      const doc = await usersCollection().doc(uid).get();

      // FIX: exists() est maintenant une méthode
      if (!doc.exists()) {
        return {
          success: false,
          error: "Profil utilisateur introuvable",
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
      console.error("[UserService] Get document error:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération du profil",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DE DOCUMENT UTILISATEUR
  // ----------------------------------------------------------

  /**
   * Met à jour le document utilisateur dans Firestore
   * Ne permet pas de modifier : id, email, createdAt
   *
   * @param uid - UID de l'utilisateur
   * @param data - Données à mettre à jour
   * @returns ApiResponse void
   */
  async updateUserDocument(
    uid: string,
    data: UpdateUserData
  ): Promise<ApiResponse> {
    try {
      const updateData: Record<string, any> = {};

      // Mapper les champs à mettre à jour
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
      }
      if (data.gender !== undefined) {
        updateData.gender = data.gender;
      }
      if (data.dateOfBirth !== undefined) {
        updateData.dateOfBirth = toTimestamp(data.dateOfBirth);
      }
      if (data.notificationsEnabled !== undefined) {
        updateData.notificationsEnabled = data.notificationsEnabled;
      }
      if (data.fcmToken !== undefined) {
        updateData.fcmToken = data.fcmToken;
      }

      // Vérifier qu'il y a des données à mettre à jour
      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: "Aucune donnée à mettre à jour",
        };
      }

      await usersCollection().doc(uid).update(updateData);

      console.log("[UserService] Document updated for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update document error:", error);

      // Gérer le cas où le document n'existe pas
      if (error.code === "firestore/not-found") {
        return {
          success: false,
          error: "Profil utilisateur introuvable",
        };
      }

      return {
        success: false,
        error: "Erreur lors de la mise à jour du profil",
      };
    }
  },

  // ----------------------------------------------------------
  // MODIFICATION DE L'EMAIL (PROMPT PROFILE-EDIT)
  // ----------------------------------------------------------

  /**
   * Met à jour l'email de l'utilisateur
   * 
   * IMPORTANT: Cette opération modifie :
   * 1. L'email dans Firebase Auth
   * 2. L'email dans le document Firestore
   * 
   * Nécessite une connexion récente (< 5 minutes)
   *
   * @param uid - UID de l'utilisateur
   * @param newEmail - Nouvel email
   * @returns ApiResponse void
   */
  async updateEmail(uid: string, newEmail: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser || currentUser.uid !== uid) {
        return {
          success: false,
          error: "Utilisateur non connecté",
        };
      }

      // Validation basique de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return {
          success: false,
          error: "Format d'email invalide",
        };
      }

      console.log("[UserService] Updating email to:", newEmail);

      // 1. Mettre à jour dans Firebase Auth
      // Cela peut lever une erreur si la connexion n'est pas récente
      await currentUser.updateEmail(newEmail);

      // 2. Mettre à jour dans Firestore
      // La règle Firestore vérifie que l'email correspond au token auth
      await usersCollection().doc(uid).update({
        email: newEmail,
      });

      // 3. Envoyer un email de vérification au nouvel email
      await currentUser.sendEmailVerification();

      console.log("[UserService] Email updated successfully for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update email error:", error);

      return {
        success: false,
        error: getErrorMessage(error.code),
        code: error.code,
      };
    }
  },

  // ----------------------------------------------------------
  // MODIFICATION DU GENRE (PROMPT PROFILE-EDIT)
  // ----------------------------------------------------------

  /**
   * Met à jour le genre de l'utilisateur
   * 
   * IMPORTANT: Le changement de genre affectera :
   * - Les défis proposés dans les futures sessions
   * - Les défis sont filtrés par genre
   *
   * @param uid - UID de l'utilisateur
   * @param newGender - Nouveau genre (homme/femme)
   * @returns ApiResponse void
   */
  async updateGender(uid: string, newGender: Gender): Promise<ApiResponse> {
    try {
      // Validation du genre
      if (newGender !== "homme" && newGender !== "femme") {
        return {
          success: false,
          error: "Genre invalide",
        };
      }

      console.log("[UserService] Updating gender to:", newGender);

      await usersCollection().doc(uid).update({
        gender: newGender,
      });

      console.log("[UserService] Gender updated successfully for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update gender error:", error);

      if (error.code === "firestore/not-found") {
        return {
          success: false,
          error: "Profil utilisateur introuvable",
        };
      }

      return {
        success: false,
        error: "Erreur lors de la mise à jour du genre",
      };
    }
  },

  // ----------------------------------------------------------
  // ÉCOUTE TEMPS RÉEL
  // ----------------------------------------------------------

  /**
   * S'abonne aux changements du document utilisateur en temps réel
   *
   * @param uid - UID de l'utilisateur
   * @param callback - Fonction appelée à chaque changement
   * @returns Fonction de désinscription (cleanup)
   */
  subscribeToUser(
    uid: string,
    callback: (user: User | null, error?: string) => void
  ): () => void {
    const unsubscribe = usersCollection()
      .doc(uid)
      .onSnapshot(
        (doc) => {
          // FIX: exists() est maintenant une méthode
          if (doc.exists()) {
            const userData = {
              id: doc.id,
              ...doc.data(),
            } as User;
            callback(userData);
          } else {
            callback(null, "Profil utilisateur introuvable");
          }
        },
        (error) => {
          console.error("[UserService] Subscribe error:", error);
          callback(null, "Erreur de synchronisation du profil");
        }
      );

    return unsubscribe;
  },

  // ----------------------------------------------------------
  // GESTION PREMIUM
  // ----------------------------------------------------------

  /**
   * Met à jour le statut premium de l'utilisateur
   *
   * @param uid - UID de l'utilisateur
   * @param isPremium - Statut premium actif ou non
   * @param plan - Plan d'abonnement (monthly/yearly) ou null
   * @param until - Date de fin d'abonnement ou null
   * @returns ApiResponse void
   */
  async updatePremiumStatus(
    uid: string,
    isPremium: boolean,
    plan: PremiumPlan | null,
    until: Date | null
  ): Promise<ApiResponse> {
    try {
      const updateData: Record<string, any> = {
        premium: isPremium,
        premiumPlan: plan,
        premiumUntil: until ? toTimestamp(until) : null,
      };

      await usersCollection().doc(uid).update(updateData);

      console.log(
        "[UserService] Premium status updated for:",
        uid,
        "| Premium:",
        isPremium
      );

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update premium error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du statut premium",
      };
    }
  },

  /**
   * Active l'abonnement premium
   *
   * @param uid - UID de l'utilisateur
   * @param plan - Plan choisi (monthly ou yearly)
   * @returns ApiResponse void
   */
  async activatePremium(
    uid: string,
    plan: PremiumPlan
  ): Promise<ApiResponse> {
    // Calculer la date de fin selon le plan
    const now = new Date();
    const until = new Date(now);

    if (plan === "monthly") {
      until.setMonth(until.getMonth() + 1);
    } else if (plan === "yearly") {
      until.setFullYear(until.getFullYear() + 1);
    }

    return this.updatePremiumStatus(uid, true, plan, until);
  },

  /**
   * Désactive l'abonnement premium
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse void
   */
  async deactivatePremium(uid: string): Promise<ApiResponse> {
    return this.updatePremiumStatus(uid, false, null, null);
  },

  /**
   * Vérifie si l'abonnement premium est encore valide
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse avec le statut de validité
   */
  async checkPremiumValidity(
    uid: string
  ): Promise<ApiResponse<{ isValid: boolean; expiresAt: Date | null }>> {
    try {
      const response = await this.getUserDocument(uid);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Utilisateur introuvable",
        };
      }

      const user = response.data;

      // Si pas premium, retourner invalide
      if (!user.premium) {
        return {
          success: true,
          data: { isValid: false, expiresAt: null },
        };
      }

      // Vérifier la date d'expiration
      if (user.premiumUntil) {
        const expirationDate = user.premiumUntil.toDate();
        const now = new Date();
        const isValid = expirationDate > now;

        // Si expiré, désactiver automatiquement
        if (!isValid) {
          await this.deactivatePremium(uid);
        }

        return {
          success: true,
          data: { isValid, expiresAt: expirationDate },
        };
      }

      // Premium actif sans date d'expiration (lifetime?)
      return {
        success: true,
        data: { isValid: true, expiresAt: null },
      };
    } catch (error: any) {
      console.error("[UserService] Check premium error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification du statut premium",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DU LAST LOGIN
  // ----------------------------------------------------------

  /**
   * Met à jour la date de dernière connexion
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse void
   */
  async updateLastLogin(uid: string): Promise<ApiResponse> {
    try {
      await usersCollection().doc(uid).update({
        lastLogin: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update last login error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour de la connexion",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DU TOKEN FCM
  // ----------------------------------------------------------

  /**
   * Met à jour le token FCM pour les notifications push
   *
   * @param uid - UID de l'utilisateur
   * @param token - Token FCM
   * @returns ApiResponse void
   */
  async updateFcmToken(
    uid: string,
    token: string | null
  ): Promise<ApiResponse> {
    try {
      await usersCollection().doc(uid).update({
        fcmToken: token,
      });

      console.log("[UserService] FCM token updated for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Update FCM token error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du token de notification",
      };
    }
  },

  // ----------------------------------------------------------
  // TOGGLE NOTIFICATIONS
  // ----------------------------------------------------------

  /**
   * Active ou désactive les notifications pour l'utilisateur
   *
   * @param uid - UID de l'utilisateur
   * @param enabled - État des notifications
   * @returns ApiResponse void
   */
  async toggleNotifications(
    uid: string,
    enabled: boolean
  ): Promise<ApiResponse> {
    try {
      await usersCollection().doc(uid).update({
        notificationsEnabled: enabled,
      });

      console.log(
        "[UserService] Notifications toggled for:",
        uid,
        "| Enabled:",
        enabled
      );

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Toggle notifications error:", error);
      return {
        success: false,
        error: "Erreur lors de la modification des notifications",
      };
    }
  },

  // ----------------------------------------------------------
  // SUPPRESSION DU DOCUMENT
  // ----------------------------------------------------------

  /**
   * Supprime le document utilisateur de Firestore
   * Note: Utiliser avec auth.service.deleteAccount() pour supprimer aussi le compte Auth
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse void
   */
  async deleteUserDocument(uid: string): Promise<ApiResponse> {
    try {
      await usersCollection().doc(uid).delete();

      console.log("[UserService] Document deleted for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error("[UserService] Delete document error:", error);
      return {
        success: false,
        error: "Erreur lors de la suppression du profil",
      };
    }
  },

  // ----------------------------------------------------------
  // VÉRIFICATION D'EXISTENCE
  // ----------------------------------------------------------

  /**
   * Vérifie si un document utilisateur existe
   *
   * @param uid - UID de l'utilisateur
   * @returns ApiResponse avec le statut d'existence
   */
  async userExists(uid: string): Promise<ApiResponse<boolean>> {
    try {
      const doc = await usersCollection().doc(uid).get();

      return {
        success: true,
        // FIX: exists() est maintenant une méthode
        data: doc.exists(),
      };
    } catch (error: any) {
      console.error("[UserService] User exists check error:", error);
      return {
        success: false,
        error: "Erreur lors de la vérification",
      };
    }
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default userService;