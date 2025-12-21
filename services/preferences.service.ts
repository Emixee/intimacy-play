/**
 * Service de gestion des préférences utilisateur
 *
 * Gère les préférences avec vérification d'accès premium :
 * - Thèmes de défis
 * - Jouets
 * - Préférences de médias
 * - Surnom du partenaire
 * - Calcul des thèmes communs entre partenaires
 */

import { usersCollection } from "../config/firebase";
import {
  Theme,
  Toy,
  UserPreferences,
  ApiResponse,
  THEMES_FREE,
  THEMES_PREMIUM,
  TOYS,
} from "../types";

// ============================================================
// TYPES SPÉCIFIQUES AU SERVICE
// ============================================================

export interface MediaPreferences {
  photo: boolean;
  audio: boolean;
  video: boolean;
}

// ============================================================
// HELPERS DE VALIDATION
// ============================================================

/**
 * Vérifie si un thème est premium
 */
const isThemePremium = (theme: Theme): boolean => {
  return (THEMES_PREMIUM as readonly string[]).includes(theme);
};

/**
 * Filtre les thèmes selon l'accès premium
 * @param themes - Liste des thèmes à filtrer
 * @param isPremium - Si l'utilisateur est premium
 * @returns Liste des thèmes autorisés
 */
const filterThemesByAccess = (themes: Theme[], isPremium: boolean): Theme[] => {
  if (isPremium) {
    return themes;
  }
  // Utilisateur gratuit : uniquement les thèmes gratuits
  return themes.filter((theme) => !isThemePremium(theme));
};

/**
 * Valide que les thèmes sont valides
 */
const validateThemes = (themes: Theme[]): boolean => {
  const allThemes = [...THEMES_FREE, ...THEMES_PREMIUM] as string[];
  return themes.every((theme) => allThemes.includes(theme));
};

/**
 * Valide que les jouets sont valides
 */
const validateToys = (toys: Toy[]): boolean => {
  return toys.every((toy) => (TOYS as readonly string[]).includes(toy));
};

// ============================================================
// SERVICE PRÉFÉRENCES
// ============================================================

export const preferencesService = {
  // ----------------------------------------------------------
  // MISE À JOUR DES THÈMES
  // ----------------------------------------------------------

  /**
   * Met à jour les thèmes de l'utilisateur
   * Vérifie l'accès premium avant d'autoriser les thèmes premium
   *
   * @param uid - UID de l'utilisateur
   * @param themes - Liste des thèmes à activer
   * @param isPremium - Si l'utilisateur est premium
   * @returns ApiResponse avec les thèmes effectivement enregistrés
   */
  async updateThemes(
    uid: string,
    themes: Theme[],
    isPremium: boolean
  ): Promise<ApiResponse<Theme[]>> {
    try {
      // Valider les thèmes
      if (!validateThemes(themes)) {
        return {
          success: false,
          error: "Un ou plusieurs thèmes sont invalides",
        };
      }

      // Filtrer selon l'accès premium
      const allowedThemes = filterThemesByAccess(themes, isPremium);

      // S'assurer qu'il y a au moins un thème
      if (allowedThemes.length === 0) {
        return {
          success: false,
          error: "Vous devez sélectionner au moins un thème",
        };
      }

      // Mettre à jour Firestore
      await usersCollection().doc(uid).update({
        "preferences.themes": allowedThemes,
      });

      console.log(
        "[PreferencesService] Themes updated for:",
        uid,
        "| Count:",
        allowedThemes.length
      );

      // Avertir si des thèmes ont été filtrés
      const filteredCount = themes.length - allowedThemes.length;
      if (filteredCount > 0) {
        console.log(
          "[PreferencesService] Filtered",
          filteredCount,
          "premium themes for non-premium user"
        );
      }

      return {
        success: true,
        data: allowedThemes,
      };
    } catch (error: any) {
      console.error("[PreferencesService] Update themes error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour des thèmes",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DES JOUETS
  // ----------------------------------------------------------

  /**
   * Met à jour les jouets de l'utilisateur
   * Les jouets sont réservés aux utilisateurs premium
   *
   * @param uid - UID de l'utilisateur
   * @param toys - Liste des jouets à activer
   * @param isPremium - Si l'utilisateur est premium
   * @returns ApiResponse avec les jouets effectivement enregistrés
   */
  async updateToys(
    uid: string,
    toys: Toy[],
    isPremium: boolean
  ): Promise<ApiResponse<Toy[]>> {
    try {
      // Les jouets sont réservés aux premium
      if (!isPremium) {
        // Retirer tous les jouets pour les non-premium
        await usersCollection().doc(uid).update({
          "preferences.toys": [],
        });

        console.log(
          "[PreferencesService] Toys cleared for non-premium user:",
          uid
        );

        return {
          success: true,
          data: [],
        };
      }

      // Valider les jouets
      if (!validateToys(toys)) {
        return {
          success: false,
          error: "Un ou plusieurs jouets sont invalides",
        };
      }

      // Mettre à jour Firestore
      await usersCollection().doc(uid).update({
        "preferences.toys": toys,
      });

      console.log(
        "[PreferencesService] Toys updated for:",
        uid,
        "| Count:",
        toys.length
      );

      return {
        success: true,
        data: toys,
      };
    } catch (error: any) {
      console.error("[PreferencesService] Update toys error:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour des jouets",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DES PRÉFÉRENCES MÉDIA
  // ----------------------------------------------------------

  /**
   * Met à jour les préférences de médias de l'utilisateur
   *
   * @param uid - UID de l'utilisateur
   * @param prefs - Préférences de médias (photo, audio, video)
   * @param isPremium - Si l'utilisateur est premium (non utilisé pour l'instant)
   * @returns ApiResponse void
   */
  async updateMediaPreferences(
    uid: string,
    prefs: MediaPreferences,
    isPremium: boolean
  ): Promise<ApiResponse> {
    try {
      // Valider qu'au moins un média est activé
      if (!prefs.photo && !prefs.audio && !prefs.video) {
        return {
          success: false,
          error: "Vous devez accepter au moins un type de média",
        };
      }

      // Mettre à jour Firestore
      await usersCollection().doc(uid).update({
        "preferences.mediaPreferences": prefs,
      });

      console.log("[PreferencesService] Media preferences updated for:", uid);

      return { success: true };
    } catch (error: any) {
      console.error(
        "[PreferencesService] Update media preferences error:",
        error
      );
      return {
        success: false,
        error: "Erreur lors de la mise à jour des préférences média",
      };
    }
  },

  // ----------------------------------------------------------
  // MISE À JOUR DU SURNOM DU PARTENAIRE
  // ----------------------------------------------------------

  /**
   * Met à jour le surnom du partenaire
   * Fonctionnalité premium uniquement
   *
   * @param uid - UID de l'utilisateur
   * @param nickname - Surnom du partenaire
   * @param isPremium - Si l'utilisateur est premium
   * @returns ApiResponse void
   */
  async updatePartnerNickname(
    uid: string,
    nickname: string,
    isPremium: boolean
  ): Promise<ApiResponse> {
    try {
      // Fonctionnalité premium
      if (!isPremium) {
        return {
          success: false,
          error: "Le surnom personnalisé est réservé aux membres Premium",
          code: "premium_required",
        };
      }

      // Valider le surnom
      const trimmedNickname = nickname.trim();
      if (trimmedNickname.length === 0) {
        return {
          success: false,
          error: "Le surnom ne peut pas être vide",
        };
      }

      if (trimmedNickname.length > 20) {
        return {
          success: false,
          error: "Le surnom ne peut pas dépasser 20 caractères",
        };
      }

      // Mettre à jour Firestore
      await usersCollection().doc(uid).update({
        partnerNickname: trimmedNickname,
      });

      console.log(
        "[PreferencesService] Partner nickname updated for:",
        uid,
        "| Nickname:",
        trimmedNickname
      );

      return { success: true };
    } catch (error: any) {
      console.error(
        "[PreferencesService] Update partner nickname error:",
        error
      );
      return {
        success: false,
        error: "Erreur lors de la mise à jour du surnom",
      };
    }
  },

  // ----------------------------------------------------------
  // CALCUL DES THÈMES COMMUNS
  // ----------------------------------------------------------

  /**
   * Calcule l'intersection des thèmes entre deux utilisateurs
   * Utilisé pour générer des défis compatibles avec les deux partenaires
   *
   * @param user1Prefs - Préférences du premier utilisateur
   * @param user2Prefs - Préférences du second utilisateur
   * @returns Liste des thèmes communs
   */
  getCommonThemes(
    user1Prefs: UserPreferences,
    user2Prefs: UserPreferences
  ): Theme[] {
    const user1Themes = new Set(user1Prefs.themes);
    const commonThemes = user2Prefs.themes.filter((theme) =>
      user1Themes.has(theme)
    );

    console.log(
      "[PreferencesService] Common themes calculated | Count:",
      commonThemes.length
    );

    return commonThemes;
  },

  // ----------------------------------------------------------
  // CALCUL DES JOUETS COMMUNS
  // ----------------------------------------------------------

  /**
   * Calcule l'intersection des jouets entre deux utilisateurs
   * Utilisé pour générer des défis avec jouets compatibles
   *
   * @param user1Prefs - Préférences du premier utilisateur
   * @param user2Prefs - Préférences du second utilisateur
   * @returns Liste des jouets communs
   */
  getCommonToys(
    user1Prefs: UserPreferences,
    user2Prefs: UserPreferences
  ): Toy[] {
    const user1Toys = new Set(user1Prefs.toys);
    const commonToys = user2Prefs.toys.filter((toy) => user1Toys.has(toy));

    console.log(
      "[PreferencesService] Common toys calculated | Count:",
      commonToys.length
    );

    return commonToys;
  },

  // ----------------------------------------------------------
  // CALCUL DES MÉDIAS COMMUNS
  // ----------------------------------------------------------

  /**
   * Calcule l'intersection des préférences média entre deux utilisateurs
   *
   * @param user1Prefs - Préférences du premier utilisateur
   * @param user2Prefs - Préférences du second utilisateur
   * @returns Préférences média communes
   */
  getCommonMediaPreferences(
    user1Prefs: UserPreferences,
    user2Prefs: UserPreferences
  ): MediaPreferences {
    return {
      photo: user1Prefs.mediaPreferences.photo && user2Prefs.mediaPreferences.photo,
      audio: user1Prefs.mediaPreferences.audio && user2Prefs.mediaPreferences.audio,
      video: user1Prefs.mediaPreferences.video && user2Prefs.mediaPreferences.video,
    };
  },

  // ----------------------------------------------------------
  // HELPERS PUBLICS
  // ----------------------------------------------------------

  /**
   * Vérifie si un thème nécessite un accès premium
   */
  isThemePremium,

  /**
   * Retourne la liste des thèmes gratuits
   */
  getFreeThemes(): Theme[] {
    return [...THEMES_FREE] as Theme[];
  },

  /**
   * Retourne la liste des thèmes premium
   */
  getPremiumThemes(): Theme[] {
    return [...THEMES_PREMIUM] as Theme[];
  },

  /**
   * Retourne la liste de tous les jouets
   */
  getAllToys(): Toy[] {
    return [...TOYS] as Toy[];
  },
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default preferencesService;