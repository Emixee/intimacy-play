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

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: FirebaseFirestoreTypes.Timestamp;
  premium: boolean;
  premiumUntil: FirebaseFirestoreTypes.Timestamp | null;
  premiumPlan: PremiumPlan | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  lastLogin: FirebaseFirestoreTypes.Timestamp;
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
    isPremium: true,
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