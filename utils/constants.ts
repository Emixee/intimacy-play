/**
 * Constantes globales - Intimacy Play
 * 
 * PROMPT 1.3-v2 : Thèmes basés sur defis_couple_distance_v4.xlsx (24 thèmes)
 * PROMPT PARTNER-CHALLENGE : Ajout fonctionnalité défis personnalisés
 * 
 * Contient toutes les constantes de configuration de l'application :
 * - App info
 * - Limites de session
 * - Thèmes et jouets
 * - Réactions
 * - Pricing premium
 * - Messages d'erreur
 */

// ============================================================
// APP INFO
// ============================================================

export const APP_NAME = "Intimacy Play";
export const APP_VERSION = "1.0.0";
export const APP_PACKAGE = "com.intimacyplay.app";

// ============================================================
// RÉACTIONS
// ============================================================

/** Réactions gratuites disponibles pour tous */
export const REACTIONS_FREE = ["❤️", "🔥", "😍", "👏"] as const;

/** Réactions premium (abonnés uniquement) */
export const REACTIONS_PREMIUM = ["🥵", "💦", "👅", "🍑", "😈", "💋"] as const;

/** Toutes les réactions */
export const ALL_REACTIONS = [...REACTIONS_FREE, ...REACTIONS_PREMIUM] as const;

/** Durée d'affichage d'une réaction (en ms) */
export const REACTION_DISPLAY_DURATION = 5000;

// ============================================================
// THÈMES (24 thèmes - basés sur defis_couple_distance_v4.xlsx)
// ============================================================

/** Thème gratuit (1) - Disponible niveaux 1-4 */
export const THEMES_FREE = [
  { 
    id: "classique", 
    name: "Classique", 
    emoji: "💕", 
    description: "Défis romantiques et sensuels",
    challengeCount: 258,
    levels: [1, 2, 3, 4],
  },
] as const;

/** Thèmes premium (23) - Disponibles niveaux 2-4 selon le thème */
export const THEMES_PREMIUM = [
  { 
    id: "lingerie", 
    name: "Lingerie", 
    emoji: "👙", 
    description: "Jeux avec sous-vêtements sexy",
    challengeCount: 24,
    levels: [2, 3, 4],
  },
  { 
    id: "dom_sub", 
    name: "Dom/Sub", 
    emoji: "👑", 
    description: "Domination et soumission",
    challengeCount: 36,
    levels: [3, 4],
  },
  { 
    id: "sperme", 
    name: "Sperme", 
    emoji: "💦", 
    description: "Jeux avec éjaculation",
    challengeCount: 34,
    levels: [4],
    warning: "Contenu explicite",
  },
  { 
    id: "jouets", 
    name: "Jouets", 
    emoji: "📳", 
    description: "Défis avec sextoys",
    challengeCount: 32,
    levels: [3, 4],
  },
  { 
    id: "oral", 
    name: "Oral", 
    emoji: "👄", 
    description: "Plaisir buccal",
    challengeCount: 30,
    levels: [3, 4],
  },
  { 
    id: "cyprine", 
    name: "Cyprine", 
    emoji: "💧", 
    description: "Jeux avec mouille féminine",
    challengeCount: 23,
    levels: [3, 4],
  },
  { 
    id: "exhib", 
    name: "Exhib/Voyeurisme", 
    emoji: "👀", 
    description: "Se montrer et regarder",
    challengeCount: 21,
    levels: [3, 4],
  },
  { 
    id: "body_writing", 
    name: "Body Writing", 
    emoji: "✍️", 
    description: "Écrire sur le corps",
    challengeCount: 19,
    levels: [3, 4],
  },
  { 
    id: "feminisation", 
    name: "Féminisation", 
    emoji: "💄", 
    description: "Travestissement et féminisation",
    challengeCount: 17,
    levels: [3, 4],
  },
  { 
    id: "pegging", 
    name: "Pegging", 
    emoji: "🍆", 
    description: "Pénétration inversée",
    challengeCount: 16,
    levels: [3, 4],
  },
  { 
    id: "sm", 
    name: "S&M", 
    emoji: "⛓️", 
    description: "Sadisme et masochisme",
    challengeCount: 16,
    levels: [3, 4],
  },
  { 
    id: "dirty_talk", 
    name: "Dirty Talk", 
    emoji: "🗣️", 
    description: "Mots crus et excitants",
    challengeCount: 16,
    levels: [3, 4],
  },
  { 
    id: "latex_cuir", 
    name: "Latex/Cuir", 
    emoji: "🖤", 
    description: "Fétichisme du latex et cuir",
    challengeCount: 15,
    levels: [3, 4],
  },
  { 
    id: "bondage", 
    name: "Bondage", 
    emoji: "🔗", 
    description: "Attaches et contraintes",
    challengeCount: 14,
    levels: [3, 4],
  },
  { 
    id: "anal", 
    name: "Anal", 
    emoji: "🍑", 
    description: "Plaisir anal",
    challengeCount: 13,
    levels: [4],
    warning: "Contenu explicite",
  },
  { 
    id: "food_play", 
    name: "Food Play", 
    emoji: "🍓", 
    description: "Jeux avec nourriture",
    challengeCount: 11,
    levels: [4],
  },
  { 
    id: "edging", 
    name: "Edging", 
    emoji: "⏱️", 
    description: "Contrôle de l'orgasme",
    challengeCount: 10,
    levels: [4],
  },
  { 
    id: "masturbation_guidee", 
    name: "Masturbation guidée", 
    emoji: "🎯", 
    description: "Instructions de plaisir",
    challengeCount: 10,
    levels: [4],
  },
  { 
    id: "humiliation", 
    name: "Humiliation", 
    emoji: "😳", 
    description: "Jeux d'humiliation consentie",
    challengeCount: 8,
    levels: [4],
    warning: "Contenu sensible",
  },
  { 
    id: "jeu_de_role", 
    name: "Jeu de rôle", 
    emoji: "🎭", 
    description: "Incarner des personnages",
    challengeCount: 8,
    levels: [4],
  },
  { 
    id: "temperature", 
    name: "Température", 
    emoji: "🧊", 
    description: "Chaud et froid",
    challengeCount: 6,
    levels: [4],
  },
  { 
    id: "worship", 
    name: "Worship", 
    emoji: "🙏", 
    description: "Adoration du corps",
    challengeCount: 6,
    levels: [4],
  },
  { 
    id: "cbt", 
    name: "CBT", 
    emoji: "⚠️", 
    description: "Torture génitale masculine",
    challengeCount: 5,
    levels: [4],
    warning: "Contenu extrême",
  },
] as const;

/** Tous les thèmes */
export const ALL_THEMES = [...THEMES_FREE, ...THEMES_PREMIUM] as const;

/** IDs des thèmes gratuits */
export const THEME_IDS_FREE = THEMES_FREE.map((t) => t.id);

/** IDs des thèmes premium */
export const THEME_IDS_PREMIUM = THEMES_PREMIUM.map((t) => t.id);

/** Récupère un thème par son ID */
export const getThemeById = (id: string) => {
  return ALL_THEMES.find((t) => t.id === id);
};

/** Vérifie si un thème est premium */
export const isThemePremium = (id: string): boolean => {
  return (THEME_IDS_PREMIUM as readonly string[]).includes(id);
};

// ============================================================
// JOUETS (10)
// ============================================================

/** Liste des jouets disponibles (Premium uniquement) */
export const TOYS = [
  { id: "vibrator", name: "Vibromasseur", emoji: "📳", description: "Vibrations de plaisir" },
  { id: "handcuffs", name: "Menottes", emoji: "🔐", description: "Attache-moi" },
  { id: "blindfold", name: "Bandeau", emoji: "🙈", description: "Privé de vue" },
  { id: "anal_plug", name: "Plug anal", emoji: "💎", description: "Plaisir interdit" },
  { id: "dildo", name: "Gode", emoji: "🍆", description: "Substitut de plaisir" },
  { id: "cock_ring", name: "Cockring", emoji: "💍", description: "Intensité prolongée" },
  { id: "massage_oil", name: "Huile de massage", emoji: "🫗", description: "Glisse sensuelle" },
  { id: "feathers", name: "Plumes", emoji: "🪶", description: "Caresses légères" },
  { id: "nipple_clamps", name: "Pinces à tétons", emoji: "📎", description: "Douleur plaisir" },
  { id: "collar", name: "Collier", emoji: "📿", description: "Marque de soumission" },
] as const;

/** IDs des jouets */
export const TOY_IDS = TOYS.map((t) => t.id);

// ============================================================
// LIMITES
// ============================================================

export const LIMITS = {
  // Session
  SESSION_CODE_LENGTH: 6,
  SESSION_CODE_EXPIRATION_HOURS: 24,
  
  // Défis
  CHALLENGES: {
    FREE: { min: 5, max: 15 },
    PREMIUM: { min: 5, max: 50 },
    DEFAULT: 10,
  },
  
  // Intensité
  INTENSITY: {
    MIN: 1,
    MAX: 4,
    DEFAULT: 1,
    FREE_MAX: 3,     // Niveaux 1-3 gratuits
    PREMIUM_MAX: 4,  // Niveau 4 premium
  },
  
  // Changements de défi
  CHANGES: {
    FREE: 3,         // 3 changements gratuits par partie
    BONUS_FROM_ADS: 3, // +3 max via publicités
  },
  
  // Parties gratuites
  FREE_GAMES_PER_DAY: 3,
  
  // Médias
  MEDIA_EXPIRATION_MINUTES: 10,
  MAX_MEDIA_SIZE_MB: 10,
  
  // Code d'invitation couple
  INVITE_CODE_EXPIRATION_HOURS: 24,
  
  // Validation
  PASSWORD_MIN_LENGTH: 6,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 30,
  MIN_AGE: 18,
  
  // Défis personnalisés (PROMPT PARTNER-CHALLENGE)
  PARTNER_CHALLENGE_MIN_LENGTH: 10,
  PARTNER_CHALLENGE_MAX_LENGTH: 500,
} as const;

// ============================================================
// PRICING PREMIUM
// ============================================================

export const PRICING = {
  MONTHLY: {
    price: 6.99,
    priceFormatted: "6,99 €",
    currency: "EUR",
    period: "month",
    periodLabel: "par mois",
    sku: "intimacy_play_premium_monthly",
    googlePlayId: "intimacy_play_premium_monthly",
  },
  YEARLY: {
    price: 39.99,
    priceFormatted: "39,99 €",
    currency: "EUR",
    period: "year",
    periodLabel: "par an",
    sku: "intimacy_play_premium_yearly",
    googlePlayId: "intimacy_play_premium_yearly",
    // Économie par rapport au mensuel
    savingsPercent: 52, // (6.99 * 12 - 39.99) / (6.99 * 12) * 100
    savingsFormatted: "Économise 52%",
    monthlyEquivalent: 3.33,
    monthlyEquivalentFormatted: "3,33 €/mois",
  },
} as const;

/** 
 * Avantages Premium 
 * PROMPT PARTNER-CHALLENGE : Ajout défis personnalisés
 */
export const PREMIUM_FEATURES = [
  {
    id: "all_levels",
    icon: "🔥",
    title: "Tous les niveaux",
    description: "Accès aux défis Explicites (niveau 4)",
  },
  {
    id: "all_themes",
    icon: "🎭",
    title: "23 thèmes exclusifs",
    description: "Dom/Sub, Bondage, Oral, Anal et plus",
  },
  {
    id: "unlimited_challenges",
    icon: "♾️",
    title: "Jusqu'à 50 défis",
    description: "Sessions plus longues et intenses",
  },
  {
    id: "partner_challenges",
    icon: "✍️",
    title: "Défis personnalisés",
    description: "Ton partenaire crée des défis sur mesure",
  },
  {
    id: "unlimited_changes",
    icon: "🔄",
    title: "Changements illimités",
    description: "Change de défi autant que tu veux",
  },
  {
    id: "exclusive_reactions",
    icon: "🥵",
    title: "Réactions exclusives",
    description: "6 emojis premium pour réagir",
  },
  {
    id: "toys",
    icon: "📳",
    title: "Défis avec jouets",
    description: "10 accessoires pour pimenter",
  },
  {
    id: "no_ads",
    icon: "🚫",
    title: "Sans publicité",
    description: "Expérience sans interruption",
  },
  {
    id: "unlimited_games",
    icon: "🎮",
    title: "Parties illimitées",
    description: "Pas de limite quotidienne",
  },
  {
    id: "partner_nickname",
    icon: "💕",
    title: "Surnom personnalisé",
    description: "Donne un petit nom à ton partenaire",
  },
] as const;

// ============================================================
// NIVEAUX D'INTENSITÉ
// ============================================================

export const INTENSITY_LEVELS = [
  {
    level: 1 as const,
    name: "Romantique",
    emoji: "😇",
    color: "#4CAF50",
    gradient: ["#4CAF50", "#81C784"],
    description: "Doux et tendre, parfait pour commencer",
    isPremium: false,
  },
  {
    level: 2 as const,
    name: "Sensuel",
    emoji: "😊",
    color: "#FF9800",
    gradient: ["#FF9800", "#FFB74D"],
    description: "Suggestif et séduisant",
    isPremium: false,
  },
  {
    level: 3 as const,
    name: "Érotique",
    emoji: "😏",
    color: "#E91E63",
    gradient: ["#E91E63", "#F48FB1"],
    description: "Passionné et osé",
    isPremium: false,
  },
  {
    level: 4 as const,
    name: "Explicite",
    emoji: "🔥",
    color: "#F44336",
    gradient: ["#F44336", "#E57373"],
    description: "Sans limites, pour les plus audacieux",
    isPremium: true,
  },
] as const;

/** Récupère les infos d'un niveau d'intensité */
export const getIntensityInfo = (level: 1 | 2 | 3 | 4) => {
  return INTENSITY_LEVELS.find((i) => i.level === level)!;
};

// ============================================================
// COULEURS (raccourcis)
// ============================================================

export const COLORS = {
  // Primaires
  primary: "#E91E63",
  primaryLight: "#FFF5F7",
  primaryDark: "#C2185B",
  
  // Secondaires
  secondary: "#FF6B85",
  accent: "#FF8FA3",
  
  // Background
  background: "#FFF5F7",
  surface: "#FFFFFF",
  
  // Texte
  text: "#212121",
  textSecondary: "#757575",
  textLight: "#9E9E9E",
  
  // Statut
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
  
  // Premium
  gold: "#FFD700",
  goldDark: "#FFA500",
  
  // Neutres
  white: "#FFFFFF",
  black: "#000000",
  border: "#E0E0E0",
  overlay: "rgba(0, 0, 0, 0.5)",
  
  // Intensités
  intensity: {
    1: "#4CAF50",
    2: "#FF9800",
    3: "#E91E63",
    4: "#F44336",
  },
} as const;

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

export const ERROR_MESSAGES: Record<string, string> = {
  // Firebase Auth
  "auth/email-already-in-use": "Cet email est déjà utilisé",
  "auth/invalid-email": "Email invalide",
  "auth/weak-password": "Mot de passe trop faible (min 6 caractères)",
  "auth/user-not-found": "Email ou mot de passe incorrect",
  "auth/wrong-password": "Email ou mot de passe incorrect",
  "auth/invalid-credential": "Email ou mot de passe incorrect",
  "auth/too-many-requests": "Trop de tentatives, réessayez plus tard",
  "auth/network-request-failed": "Erreur réseau, vérifiez votre connexion",
  "auth/user-disabled": "Ce compte a été désactivé",
  
  // Session
  SESSION_NOT_FOUND: "Session introuvable",
  SESSION_FULL: "Cette session est déjà complète",
  SESSION_EXPIRED: "Cette session a expiré",
  SESSION_ALREADY_STARTED: "Cette session a déjà commencé",
  SESSION_COMPLETED: "Cette session est terminée",
  
  // Couple
  COUPLE_NOT_FOUND: "Couple introuvable",
  INVITE_CODE_INVALID: "Code d'invitation invalide",
  INVITE_CODE_EXPIRED: "Code d'invitation expiré",
  CANNOT_JOIN_OWN_COUPLE: "Vous ne pouvez pas rejoindre votre propre couple",
  ALREADY_IN_COUPLE: "Vous êtes déjà en couple",
  
  // Premium
  PREMIUM_REQUIRED: "Cette fonctionnalité nécessite un abonnement Premium",
  BOTH_PREMIUM_REQUIRED: "Les deux joueurs doivent être Premium",
  PURCHASE_FAILED: "L'achat a échoué, veuillez réessayer",
  PURCHASE_CANCELLED: "Achat annulé",
  
  // Partner Challenge (PROMPT PARTNER-CHALLENGE)
  PENDING_CHALLENGE_EXISTS: "Un défi partenaire est déjà en attente",
  NO_PENDING_CHALLENGE: "Aucun défi partenaire en attente",
  INVALID_CHALLENGE_TEXT: "Le texte du défi doit contenir entre 10 et 500 caractères",
  CANNOT_SUBMIT_OWN_REQUEST: "Vous ne pouvez pas soumettre votre propre demande",
  
  // Général
  UNKNOWN: "Une erreur est survenue",
  NETWORK_ERROR: "Erreur de connexion",
  PERMISSION_DENIED: "Accès refusé",
} as const;

/** Traduit un code d'erreur en message lisible */
export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
};

// ============================================================
// REGEX DE VALIDATION
// ============================================================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SESSION_CODE: /^[A-Z0-9]{6}$/,
  DISPLAY_NAME: /^[a-zA-ZÀ-ÿ0-9\s\-']+$/,
} as const;

// ============================================================
// CARACTÈRES POUR CODES
// ============================================================

/** Caractères utilisés pour générer les codes de session (sans ambiguïté) */
export const SESSION_CODE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Caractères utilisés pour les codes d'invitation */
export const INVITE_CODE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_ID: "user_id",
  FCM_TOKEN: "fcm_token",
  ONBOARDING_COMPLETED: "onboarding_completed",
  LAST_SESSION_CODE: "last_session_code",
  FREE_GAMES_TODAY: "free_games_today",
  FREE_GAMES_DATE: "free_games_date",
  PREFERENCES: "preferences",
} as const;

// ============================================================
// TIMEOUTS (en ms)
// ============================================================

export const TIMEOUTS = {
  SPLASH_SCREEN: 2000,
  SESSION_SEARCH: 30000,
  API_REQUEST: 10000,
  DEBOUNCE_INPUT: 300,
  REACTION_ANIMATION: 2000,
  TOAST_DURATION: 3000,
} as const;

// ============================================================
// EXPORTS PAR DÉFAUT
// ============================================================

export default {
  APP_NAME,
  APP_VERSION,
  REACTIONS_FREE,
  REACTIONS_PREMIUM,
  THEMES_FREE,
  THEMES_PREMIUM,
  ALL_THEMES,
  TOYS,
  LIMITS,
  PRICING,
  INTENSITY_LEVELS,
  COLORS,
  ERROR_MESSAGES,
};