/**
 * Types TypeScript pour Intimacy Play
 * 
 * PROMPT 4.3 : Ajout des types pour défis partenaires
 * 
 * Aligné avec le code existant ET FIRESTORE-SCHEMA.md
 * Compatible avec services/session.service.ts, services/game.service.ts, etc.
 */

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

// Alias pour simplifier
type Timestamp = FirebaseFirestoreTypes.Timestamp;

// ============================================================
// TYPES DE BASE (Enums / Union Types)
// ============================================================

/** Genre de l'utilisateur */
export type Gender = "homme" | "femme";

/** Plan d'abonnement premium */
export type PremiumPlan = "monthly" | "yearly";

/** Statut d'une session de jeu */
export type SessionStatus = "waiting" | "active" | "completed" | "abandoned";

/** Niveau d'intensité des défis (1-4) */
export type IntensityLevel = 1 | 2 | 3 | 4;

/** Rôle du joueur dans la session */
export type PlayerRole = "creator" | "partner";

/** Type de défi */
export type ChallengeType = "audio" | "video" | "photo" | "texte";

/** Type de message dans le chat */
export type MessageType = "text" | "photo" | "video" | "audio";

/** Langue de l'application */
export type Language = "fr" | "en";

// ============================================================
// THÈMES
// ============================================================

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

// ============================================================
// JOUETS
// ============================================================

/** Liste des jouets disponibles (Premium) */
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

// ============================================================
// RÉACTIONS
// ============================================================

/** Réactions gratuites */
export const REACTIONS_FREE = ["❤️", "🔥", "😍", "👏"] as const;

/** Réactions premium */
export const REACTIONS_PREMIUM = ["🥵", "💦", "👅", "🍑", "😈", "💋"] as const;

/** Toutes les réactions */
export type Reaction =
  | (typeof REACTIONS_FREE)[number]
  | (typeof REACTIONS_PREMIUM)[number];

// ============================================================
// CONSTANTES DE LIMITES
// ============================================================

/** Nombre de défis (min/max) */
export const CHALLENGE_COUNT_FREE = { min: 5, max: 15 };
export const CHALLENGE_COUNT_PREMIUM = { min: 5, max: 50 };

/** Nombre maximum de changements de défi par partie */
export const MAX_CHALLENGE_CHANGES = 3;

/** Nombre maximum de changements bonus via pub */
export const MAX_BONUS_CHANGES = 3;

/** Nombre maximum de parties gratuites par jour */
export const MAX_FREE_GAMES_PER_DAY = 3;

/** Durée d'expiration des médias (en minutes) */
export const MEDIA_EXPIRATION_MINUTES = 10;

/** Durée d'expiration du code de session (en heures) */
export const SESSION_CODE_EXPIRATION_HOURS = 24;

// ============================================================
// NIVEAUX D'INTENSITÉ
// ============================================================

export interface IntensityInfo {
  level: IntensityLevel;
  name: string;
  emoji: string;
  description: string;
  isPremium: boolean;
}

/**
 * Configuration des niveaux d'intensité
 * - Niveaux 1-3 : Gratuits
 * - Niveau 4 : Premium uniquement
 */
export const INTENSITY_LEVELS: IntensityInfo[] = [
  {
    level: 1,
    name: "Romantique",
    emoji: "😇",
    description: "Doux et tendre, parfait pour commencer",
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
    description: "Sans limites, pour les plus audacieux",
    isPremium: true,
  },
];

// ============================================================
// USER PREFERENCES
// ============================================================

/**
 * Préférences utilisateur
 * Stockées dans le document user.preferences
 */
export interface UserPreferences {
  /** Thèmes de défis activés */
  themes: Theme[];

  /** Jouets possédés (Premium uniquement) */
  toys: Toy[];

  /** Préférences de type de médias acceptés */
  mediaPreferences: {
    photo: boolean;
    audio: boolean;
    video: boolean;
  };

  /** Langue de l'application */
  language: Language;
}

/** Préférences par défaut pour un nouvel utilisateur */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themes: ["romantic", "sensual"],
  toys: [],
  mediaPreferences: {
    photo: true,
    audio: true,
    video: true,
  },
  language: "fr",
};

// ============================================================
// USER
// ============================================================

/**
 * Document utilisateur Firestore
 * Chemin: /users/{userId}
 */
export interface User {
  /** ID Firestore (= Firebase Auth UID) */
  id: string;

  // Identité
  email: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: Timestamp;

  // Premium
  premium: boolean;
  premiumUntil: Timestamp | null;
  premiumPlan: PremiumPlan | null;

  // Préférences
  preferences: UserPreferences;

  // Timestamps
  createdAt: Timestamp;
  lastLogin: Timestamp;

  // Notifications
  notificationsEnabled: boolean;
  fcmToken: string | null;
}

/** Données pour créer un nouvel utilisateur */
export interface CreateUserData {
  email: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: Date;
}

// ============================================================
// SESSION CHALLENGE
// ============================================================

/**
 * Défi dans une session
 * Compatible avec la structure utilisée dans data/challenges.ts
 * 
 * PROMPT 4.3 : Ajout de createdByPartner pour les défis personnalisés
 */
export interface SessionChallenge {
  /** Texte du défi */
  text: string;
  
  /** Niveau d'intensité */
  level: IntensityLevel;
  
  /** Type de média requis */
  type: ChallengeType;
  
  /** Genre pour lequel le défi est écrit (contenu textuel) */
  forGender: Gender;
  
  /** 
   * Rôle du joueur qui doit FAIRE ce défi
   * Permet de gérer les couples de même genre
   */
  forPlayer: PlayerRole;
  
  /** Défi complété ? */
  completed: boolean;
  
  /** UID de celui qui a complété */
  completedBy: string | null;
  
  /** Date de complétion */
  completedAt: Timestamp | null;

  /**
   * PROMPT 4.3 : Indique si le défi a été créé par le partenaire (Premium)
   * Optionnel pour rétrocompatibilité
   */
  createdByPartner?: boolean;
}

// ============================================================
// PENDING PARTNER CHALLENGE (Premium)
// ============================================================

/**
 * PROMPT 4.3 : Défi en attente créé par le partenaire
 * Stocké dans session.pendingPartnerChallenge
 */
export interface PendingPartnerChallenge {
  /** Texte du défi proposé (optionnel, rempli par le partenaire) */
  text?: string;
  /** Niveau d'intensité */
  level?: IntensityLevel;
  /** Type de média requis */
  type?: ChallengeType;
  /** ID du joueur qui a DEMANDÉ le défi (pas celui qui le crée) */
  createdBy: string;
  /** Rôle du joueur qui doit faire ce défi */
  forPlayer: PlayerRole;
  /** Date de création de la demande */
  createdAt: Timestamp;
}

// ============================================================
// SESSION
// ============================================================

/**
 * Document session Firestore
 * Chemin: /sessions/{sessionCode}
 * 
 * Compatible avec session.service.ts et game.service.ts
 * 
 * PROMPT 4.3 : Ajout de pendingPartnerChallenge
 */
export interface Session {
  /** ID Firestore (= sessionCode normalisé) */
  id: string;

  // Participants
  creatorId: string;
  creatorGender: Gender;
  partnerId: string | null;
  partnerGender: Gender | null;

  // État de la session
  status: SessionStatus;

  // Configuration
  challengeCount: number;
  startIntensity: IntensityLevel;

  // Progression
  currentChallengeIndex: number;
  currentPlayer: PlayerRole;

  // Défis
  challenges: SessionChallenge[];

  // Compteurs de changements (structure FLAT - compatible avec le code existant)
  creatorChangesUsed: number;
  partnerChangesUsed: number;
  creatorBonusChanges: number;
  partnerBonusChanges: number;

  /**
   * PROMPT 4.3 : Défi partenaire en attente (Premium)
   * null si aucune demande en cours
   */
  pendingPartnerChallenge?: PendingPartnerChallenge | null;

  // Timestamps
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

/** Données pour créer une nouvelle session */
export interface CreateSessionData {
  challengeCount: number;
  startIntensity: IntensityLevel;
}

// ============================================================
// MESSAGE
// ============================================================

/**
 * Document message Firestore
 * Chemin: /sessions/{sessionCode}/messages/{messageId}
 */
export interface Message {
  id: string;

  // Expéditeur
  senderId: string;
  senderGender: Gender;

  // Contenu
  type: MessageType;
  content: string;

  // Médias
  mediaUrl: string | null;
  mediaThumbnail: string | null;
  mediaExpiresAt: Timestamp | null;
  mediaDownloaded: boolean;

  // Lecture
  read: boolean;
  readAt: Timestamp | null;

  // Timestamp
  createdAt: Timestamp;
}

/** Données pour créer un nouveau message */
export interface CreateMessageData {
  type: MessageType;
  content: string;
  mediaUri?: string;
}

// ============================================================
// CHALLENGE TEMPLATE
// ============================================================

/**
 * Template de défi (données statiques)
 * Utilisé pour générer les SessionChallenge
 */
export interface ChallengeTemplate {
  text: string;
  level: IntensityLevel;
  gender: Gender;
  type: ChallengeType;
  theme: string;
}

// ============================================================
// AUTH TYPES
// ============================================================

/** État de l'authentification */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Credentials pour login */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Credentials pour inscription */
export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
  gender: Gender;
  dateOfBirth: Date;
}

// ============================================================
// API RESPONSE
// ============================================================

/** Réponse générique d'API/Service */
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================
// GAME TYPES (pour game.tsx)
// ============================================================

/** Défi alternatif pour le changement */
export interface AlternativeChallenge {
  id: string;
  challenge: SessionChallenge;
}

/**
 * PROMPT 4.3 : Résultat du changement de défi
 */
export interface ChangeChallengeResult {
  alternatives: SessionChallenge[];
  remainingChanges: number;
  totalChanges: number;
  isUnlimited: boolean;
}

/**
 * PROMPT 4.3 : Résultat de la complétion d'un défi
 */
export interface CompleteChallengeResult {
  nextChallenge: SessionChallenge | null;
  nextIndex: number;
  isGameOver: boolean;
  progress: number;
}

/**
 * PROMPT 4.3 : Statistiques de jeu
 */
export interface GameStats {
  completed: number;
  total: number;
  progress: number;
  byLevel: Record<IntensityLevel, { completed: number; total: number }>;
}

// ============================================================
// NAVIGATION PARAMS
// ============================================================

/** Params pour la navigation Expo Router */
export type RootStackParamList = {
  "(auth)/login": undefined;
  "(auth)/register": undefined;
  "(auth)/forgot-password": undefined;
  "(main)/home": undefined;
  "(main)/profile": undefined;
  "(main)/preferences": undefined;
  "(main)/create-session": undefined;
  "(main)/join-session": undefined;
  "(main)/waiting-room": { sessionCode: string };
  "(main)/game": { sessionCode: string };
  "(main)/premium": undefined;
};

// ============================================================
// UTILITY TYPES
// ============================================================

/** Rend certaines propriétés optionnelles */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Rend toutes les propriétés optionnelles récursivement */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};