/**
 * Fonctions utilitaires générales
 */

import {
  SESSION_CODE_CHARACTERS,
  ERROR_MESSAGES,
  LIMITS,
} from "./constants";

// Valeurs extraites de LIMITS
const SESSION_CODE_LENGTH = LIMITS.SESSION_CODE_LENGTH;
const MIN_AGE = LIMITS.MIN_AGE;

// ============================================================
// GÉNÉRATION DE CODE SESSION
// ============================================================

/**
 * Génère un code de session unique de 6 caractères
 */
export function generateSessionCode(): string {
  let code = "";
  for (let i = 0; i < SESSION_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(
      Math.random() * SESSION_CODE_CHARACTERS.length
    );
    code += SESSION_CODE_CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Formate un code de session pour l'affichage (ABC 123)
 */
export function formatSessionCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Nettoie un code de session
 */
export function cleanSessionCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

// ============================================================
// VALIDATION D'ÂGE
// ============================================================

/**
 * Vérifie si une date de naissance correspond à un utilisateur de 18+
 */
export function isAdult(dateOfBirth: Date): boolean {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  
  return age >= MIN_AGE;
}

/**
 * Calcule l'âge à partir d'une date de naissance
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  
  return age;
}

// ============================================================
// MÉLANGE DE TABLEAUX
// ============================================================

/**
 * Mélange un tableau de façon aléatoire (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================
// GESTION D'ERREURS
// ============================================================

/**
 * Récupère le message d'erreur utilisateur
 */
export function getErrorMessage(errorCode: string): string {
  return (
    ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] ||
    ERROR_MESSAGES.UNKNOWN
  );
}

// ============================================================
// FORMATAGE
// ============================================================

/**
 * Formate une date en français (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Capitalise la première lettre
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie si un code de session est valide
 */
export function isValidSessionCode(code: string): boolean {
  const cleaned = cleanSessionCode(code);
  return /^[A-Z0-9]{6}$/.test(cleaned);
}

// ============================================================
// DÉLAIS
// ============================================================

/**
 * Attend un certain temps
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// SÉCURITÉ
// ============================================================

/**
 * Masque un email pour l'affichage
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  if (!username || !domain) return email;
  
  const visibleStart = username.slice(0, 2);
  const maskedPart = "*".repeat(Math.min(username.length - 2, 5));
  
  return `${visibleStart}${maskedPart}@${domain}`;
}