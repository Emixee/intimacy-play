import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

// ============================================================
// TYPES DE BASE
// ============================================================

export type Gender = "homme" | "femme";
export type PremiumPlan = "monthly" | "yearly";
export type SessionStatus = "waiting" | "active" | "completed" | "abandoned";
export type IntensityLevel = 1 | 2 | 3 | 4;
export type PlayerRole = "creator" | "partner";
export type ChallengeType = "audio" | "video" | "photo" | "texte";

// ============================================================
// CONSTANTES
// ============================================================

/** Nombre maximum de changements de défi par partie */
export const MAX_CHALLENGE_CHANGES = 3;

/** Nombre maximum de changements bonus via pub */
export const MAX_BONUS_CHANGES = 3;

/** Thèmes gratuits */
export const THEMES_FREE = ["romantic", "sensual"] as const;

/** Thèmes premium */
export const THEMES_PREMIUM = [
  "torrid",
  "fantasies",
  "roleplay",
  "domination",
  "submission",
  "bdsm_light",
  "voyeurism",
  "exhibitionism",
  "foreplay",
  "fellatio",
  "cunnilingus",
  "kamasutra",
  "shower",
  "massage",
  "food",
  "temperature",
  "dirty_talk",
  "sexting",
  "surprises",
  "quickie",
  "tantrism",
  "random",
] as const;

/** Tous les thèmes disponibles */
export type Theme = (typeof THEMES_FREE)[number] | (typeof THEMES_PREMIUM)[number];

/** Jouets disponibles (Premium) */
export const TOYS = [
  "vibrator",
  "handcuffs",
  "blindfold",
  "anal_plug",
  "dildo",
  "cock_ring",
  "massage_oil",
  "feathers",
  "nipple_clamps",
  "collar",
] as const;

export type Toy = (typeof TOYS)[number];

/** Réactions gratuites */
export const REACTIONS_FREE = ["❤️", "🔥", "😍", "👏"] as const;

/** Réactions premium */
export const REACTIONS_PREMIUM = ["🥵", "💦", "👅", "🍑", "😈", "💋"] as const;

export type Reaction =
  | (typeof REACTIONS_FREE)[number]
  | (typeof REACTIONS_PREMIUM)[number];

// ============================================================
// USER PREFERENCES
// ============================================================

/**
 * Préférences utilisateur
 * ⚠️ REQUIS par les règles Firestore lors de la création du compte
 */
export interface UserPreferences {
  /** Thèmes de défis activés (gratuit: romantic, sensual) */
  themes: Theme[];

  /** Jouets possédés (Premium uniquement) */
  toys: Toy[];

  /** Préférences de type de médias acceptés (Premium uniquement) */
  mediaPreferences: {
    photo: boolean;
    audio: boolean;
    video: boolean;
  };

  /** Langue de l'application */
  language: "fr" | "en";
}

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: FirebaseFirestoreTypes.Timestamp;

  // Couple
  coupleId: string | null;
  partnerNickname: string | null;

  // Premium
  premium: boolean;
  premiumUntil: FirebaseFirestoreTypes.Timestamp | null;
  premiumPlan: PremiumPlan | null;

  // Préférences (REQUIS par les règles Firestore)
  preferences: UserPreferences;

  // Timestamps
  createdAt: FirebaseFirestoreTypes.Timestamp;
  lastLogin: FirebaseFirestoreTypes.Timestamp;

  // Notifications
  notificationsEnabled: boolean;
  fcmToken: string | null;
}

export interface CreateUserData {
  email: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: Date;
}

// ============================================================
// SESSION
// ============================================================

export interface Session {
  id: string;
  creatorId: string;
  creatorGender: Gender;
  partnerId: string | null;
  partnerGender: Gender | null;
  status: SessionStatus;
  challengeCount: number;
  startIntensity: IntensityLevel;
  currentChallengeIndex: number;
  currentPlayer: PlayerRole;
  challenges: SessionChallenge[];
  // Compteurs de changements de défis
  creatorChangesUsed: number;
  partnerChangesUsed: number;
  creatorBonusChanges: number;
  partnerBonusChanges: number;
  // Timestamps
  createdAt: FirebaseFirestoreTypes.Timestamp;
  startedAt: FirebaseFirestoreTypes.Timestamp | null;
  completedAt: FirebaseFirestoreTypes.Timestamp | null;
}

export interface SessionChallenge {
  text: string;
  level: IntensityLevel;
  type: ChallengeType;
  forGender: Gender;
  completed: boolean;
  completedBy: string | null;
  completedAt: FirebaseFirestoreTypes.Timestamp | null;
}

export interface CreateSessionData {
  challengeCount: number;
  startIntensity: IntensityLevel;
}

// ============================================================
// CHALLENGE TEMPLATE
// ============================================================

export interface ChallengeTemplate {
  text: string;
  level: IntensityLevel;
  gender: Gender;
  type: ChallengeType;
  theme: string;
}

// ============================================================
// INTENSITY INFO
// ============================================================

export interface IntensityInfo {
  level: IntensityLevel;
  name: string;
  emoji: string;
  description: string;
  isPremium: boolean;
}

/**
 * Niveaux d'intensité disponibles
 * - Niveaux 1-3 : Gratuits
 * - Niveau 4 : Premium uniquement
 */
export const INTENSITY_LEVELS: IntensityInfo[] = [
  {
    level: 1,
    name: "Romantique",
    emoji: "😇",
    description: "Doux et tendre",
    isPremium: false,
  },
  {
    level: 2,
    name: "Sensuel",
    emoji: "😊",
    description: "Suggestif et séduisant",
    isPremium: false,
  },
  {
    level: 3,
    name: "Érotique",
    emoji: "😏",
    description: "Passionné et osé",
    isPremium: false,
  },
  {
    level: 4,
    name: "Explicite",
    emoji: "🔥",
    description: "Sans limites",
    isPremium: true,
  },
];

// ============================================================
// AUTH TYPES
// ============================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
  gender: Gender;
  dateOfBirth: Date;
}

// ============================================================
// API RESPONSE
// ============================================================

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// MESSAGE TYPES (pour le chat futur)
// ============================================================

export type MessageType = "text" | "photo" | "video" | "audio";

export interface Message {
  id: string;
  senderId: string;
  senderGender: Gender;
  type: MessageType;
  content: string;
  mediaUrl: string | null;
  mediaThumbnail: string | null;
  mediaExpiresAt: FirebaseFirestoreTypes.Timestamp | null;
  mediaDownloaded: boolean;
  read: boolean;
  readAt: FirebaseFirestoreTypes.Timestamp | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

// ============================================================
// COUPLE TYPES (pour le système de couples futur)
// ============================================================

export type CoupleStatus = "pending" | "active" | "unlinked";

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
  inviteCodeExpiresAt: FirebaseFirestoreTypes.Timestamp;
  status: CoupleStatus;
  bothPremium: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  linkedAt: FirebaseFirestoreTypes.Timestamp | null;
  unlinkedAt: FirebaseFirestoreTypes.Timestamp | null;
}