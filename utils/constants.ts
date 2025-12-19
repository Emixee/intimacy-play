/**
 * Constantes globales de l'application Intimacy Play
 */

// ============================================================
// APP INFO
// ============================================================

export const APP_NAME = "Intimacy Play";
export const APP_VERSION = "1.0.0";

// ============================================================
// LIMITES DE SESSION
// ============================================================

export const MIN_CHALLENGES = 5;
export const MAX_CHALLENGES_FREE = 15;
export const MAX_CHALLENGES_PREMIUM = 50;
export const DEFAULT_CHALLENGE_COUNT = 10;

export const SESSION_CODE_LENGTH = 6;
export const SESSION_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ============================================================
// INTENSITÉ
// ============================================================

export const MIN_INTENSITY = 1;
export const MAX_INTENSITY = 4;
export const DEFAULT_INTENSITY = 1;
export const FREE_MAX_INTENSITY = 2;
export const PREMIUM_MAX_INTENSITY = 4;

// ============================================================
// PREMIUM
// ============================================================

export const PREMIUM_MONTHLY_PRICE = 4.99;
export const PREMIUM_YEARLY_PRICE = 39.99;
export const PREMIUM_MONTHLY_SKU = "intimacy_play_premium_monthly";
export const PREMIUM_YEARLY_SKU = "intimacy_play_premium_yearly";

// ============================================================
// VALIDATION
// ============================================================

export const MIN_PASSWORD_LENGTH = 6;
export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 30;
export const MIN_AGE = 18;

// ============================================================
// COULEURS
// ============================================================

export const COLORS = {
  primary: "#EC4899",
  primaryLight: "#FDF2F8",
  primaryDark: "#DB2777",
  secondary: "#F97316",
  secondaryLight: "#FFF7ED",
  background: "#FDF2F8",
  text: "#1F2937",
  textLight: "#6B7280",
  white: "#FFFFFF",
  black: "#000000",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
} as const;

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

export const ERROR_MESSAGES = {
  "auth/email-already-in-use": "Cet email est déjà utilisé",
  "auth/invalid-email": "Email invalide",
  "auth/weak-password": "Mot de passe trop faible (min 6 caractères)",
  "auth/user-not-found": "Email ou mot de passe incorrect",
  "auth/wrong-password": "Email ou mot de passe incorrect",
  "auth/too-many-requests": "Trop de tentatives, réessayez plus tard",
  "auth/network-request-failed": "Erreur réseau, vérifiez votre connexion",
  SESSION_NOT_FOUND: "Session introuvable",
  SESSION_FULL: "Cette session est déjà complète",
  SESSION_EXPIRED: "Cette session a expiré",
  UNKNOWN: "Une erreur est survenue",
} as const;

// ============================================================
// REGEX
// ============================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/;