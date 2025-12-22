/**
 * Algorithme de sélection des défis pour Intimacy Play
 *
 * PROMPT 1.3-v3 : Préférences séparées par joueur
 * - Chaque joueur a ses propres thèmes, jouets, préférences média
 * - Les défis du créateur sont filtrés selon ses préférences
 * - Les défis du partenaire sont filtrés selon ses préférences
 *
 * Fonctionnalités :
 * - Filtrage par thèmes sélectionnés (par joueur)
 * - Filtrage par jouets disponibles (par joueur)
 * - Filtrage par préférences média (par joueur)
 * - Progression d'intensité (0-40% niveau de départ, 40-70% +1, etc.)
 * - Alternance créateur/partenaire
 * - Gestion des couples de même genre via forPlayer
 * - Retourne 2 alternatives pour le changement de défi
 */

import type {
  Gender,
  IntensityLevel,
  ChallengeType,
  SessionChallenge,
  PlayerRole,
} from "../types";

import {
  ExtendedChallengeTemplate,
  CHALLENGES_MAP,
  getAllChallenges,
} from "../data/challengesData";

// ============================================================
// TYPES
// ============================================================

/**
 * Préférences d'un joueur (thèmes, jouets, médias)
 */
export interface PlayerPreferences {
  /** Thèmes sélectionnés */
  selectedThemes: string[];
  /** Inclure les défis avec jouets */
  includeToys: boolean;
  /** Liste des jouets disponibles */
  availableToys: string[];
  /** Préférences média */
  mediaPreferences: {
    photo: boolean;
    audio: boolean;
    video: boolean;
  };
}

/**
 * Configuration pour la sélection des défis
 * PROMPT 1.3-v3 : Préférences séparées par joueur
 */
export interface SelectionConfig {
  /** Genre du créateur de la session */
  creatorGender: Gender;
  /** Genre du partenaire */
  partnerGender: Gender;
  /** Nombre de défis à sélectionner */
  count: number;
  /** Niveau d'intensité de départ (1-4) */
  startIntensity: IntensityLevel;
  /** Si l'utilisateur est premium */
  isPremium: boolean;
  
  // ============================================================
  // PRÉFÉRENCES PAR JOUEUR (PROMPT 1.3-v3)
  // ============================================================
  
  /** Préférences du créateur */
  creatorPreferences: PlayerPreferences;
  /** Préférences du partenaire */
  partnerPreferences: PlayerPreferences;
}

/**
 * Résultat de la sélection
 */
export interface SelectionResult {
  /** Défis sélectionnés */
  challenges: SessionChallenge[];
  /** Statistiques de la sélection */
  stats: {
    total: number;
    byLevel: Record<IntensityLevel, number>;
    byType: Record<ChallengeType, number>;
    byPlayer: Record<PlayerRole, number>;
    withToys: number;
  };
  /** Avertissements éventuels */
  warnings: string[];
}

/**
 * Distribution de la progression
 */
interface ProgressionDistribution {
  position: number;
  level: IntensityLevel;
  forPlayer: PlayerRole;
}

/**
 * Alternatives pour le changement de défi
 */
export interface ChallengeAlternatives {
  /** Les 2 défis alternatifs proposés */
  alternatives: SessionChallenge[];
  /** Nombre d'alternatives disponibles */
  availableCount: number;
}

// ============================================================
// PRÉFÉRENCES PAR DÉFAUT
// ============================================================

/**
 * Préférences par défaut pour un joueur
 */
export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = {
  selectedThemes: ["classique"],
  includeToys: false,
  availableToys: [],
  mediaPreferences: {
    photo: true,
    audio: true,
    video: true,
  },
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Mélange un tableau avec l'algorithme Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Vérifie si un niveau est accessible
 */
export function isLevelAccessible(
  level: IntensityLevel,
  isPremium: boolean
): boolean {
  // Niveaux 1-3 gratuits, niveau 4 premium uniquement
  if (level <= 3) return true;
  return isPremium;
}

/**
 * Retourne les niveaux accessibles
 */
export function getAccessibleLevels(isPremium: boolean): IntensityLevel[] {
  if (isPremium) {
    return [1, 2, 3, 4];
  }
  return [1, 2, 3];
}

/**
 * Calcule le niveau maximum accessible
 */
function getMaxLevel(isPremium: boolean): IntensityLevel {
  return isPremium ? 4 : 3;
}

/**
 * Calcule la distribution de progression
 * 
 * Progression :
 * - 0-40% : niveau de départ
 * - 40-70% : niveau + 1
 * - 70-90% : niveau + 2
 * - 90-100% : niveau maximum
 */
function calculateProgressionDistribution(
  count: number,
  startIntensity: IntensityLevel,
  maxLevel: IntensityLevel
): ProgressionDistribution[] {
  const distribution: ProgressionDistribution[] = [];

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    let level: IntensityLevel;

    if (progress < 0.4) {
      // 0-40% : niveau de départ
      level = startIntensity;
    } else if (progress < 0.7) {
      // 40-70% : niveau + 1
      level = Math.min(startIntensity + 1, maxLevel) as IntensityLevel;
    } else if (progress < 0.9) {
      // 70-90% : niveau + 2
      level = Math.min(startIntensity + 2, maxLevel) as IntensityLevel;
    } else {
      // 90-100% : niveau maximum
      level = maxLevel;
    }

    // Alternance créateur/partenaire
    const forPlayer: PlayerRole = i % 2 === 0 ? "creator" : "partner";

    distribution.push({ position: i, level, forPlayer });
  }

  return distribution;
}

// ============================================================
// FONCTIONS DE FILTRAGE
// ============================================================

/**
 * Filtre par thèmes sélectionnés
 */
function filterByThemes(
  challenges: ExtendedChallengeTemplate[],
  selectedThemes: string[]
): ExtendedChallengeTemplate[] {
  // Si aucun thème sélectionné, inclure "classique" par défaut
  if (selectedThemes.length === 0) {
    return challenges.filter((c) => c.theme === "classique");
  }
  return challenges.filter((c) => selectedThemes.includes(c.theme));
}

/**
 * Filtre par jouets
 */
function filterByToys(
  challenges: ExtendedChallengeTemplate[],
  includeToys: boolean,
  availableToys: string[]
): ExtendedChallengeTemplate[] {
  if (!includeToys) {
    // Exclure tous les défis avec jouets
    return challenges.filter((c) => !c.hasToy);
  }

  // Inclure les défis sans jouet + ceux avec jouets disponibles
  return challenges.filter((c) => {
    if (!c.hasToy) return true;
    if (!c.toyName) return true;
    return availableToys.includes(c.toyName);
  });
}

/**
 * Filtre par préférences média
 */
function filterByMedia(
  challenges: ExtendedChallengeTemplate[],
  preferences: { photo: boolean; audio: boolean; video: boolean }
): ExtendedChallengeTemplate[] {
  const allowedTypes: ChallengeType[] = ["texte"]; // Toujours inclure texte

  if (preferences.photo) allowedTypes.push("photo");
  if (preferences.audio) allowedTypes.push("audio");
  if (preferences.video) allowedTypes.push("video");

  return challenges.filter((c) => allowedTypes.includes(c.type));
}

/**
 * Filtre par niveau maximum
 */
function filterByMaxLevel(
  challenges: ExtendedChallengeTemplate[],
  maxLevel: IntensityLevel
): ExtendedChallengeTemplate[] {
  return challenges.filter((c) => c.level <= maxLevel);
}

/**
 * Applique tous les filtres pour UN joueur
 * PROMPT 1.3-v3 : Filtrage par préférences individuelles
 */
function applyFiltersForPlayer(
  challenges: ExtendedChallengeTemplate[],
  preferences: PlayerPreferences,
  maxLevel: IntensityLevel
): ExtendedChallengeTemplate[] {
  let filtered = challenges;
  filtered = filterByThemes(filtered, preferences.selectedThemes);
  filtered = filterByToys(filtered, preferences.includeToys, preferences.availableToys);
  filtered = filterByMedia(filtered, preferences.mediaPreferences);
  filtered = filterByMaxLevel(filtered, maxLevel);
  
  return filtered;
}

// ============================================================
// FONCTION DE SÉLECTION PRINCIPALE
// ============================================================

/**
 * Sélectionne les défis selon la configuration
 * PROMPT 1.3-v3 : Préférences séparées par joueur
 */
export function selectChallenges(config: SelectionConfig): SelectionResult {
  const {
    creatorGender,
    partnerGender,
    count,
    startIntensity,
    isPremium,
    creatorPreferences,
    partnerPreferences,
  } = config;

  const warnings: string[] = [];
  const maxLevel = getMaxLevel(isPremium);

  // Calculer la distribution de progression
  const distribution = calculateProgressionDistribution(
    count,
    startIntensity,
    maxLevel
  );

  // ============================================================
  // FILTRAGE PAR JOUEUR (PROMPT 1.3-v3)
  // ============================================================
  
  // Charger TOUS les défis
  const allChallenges = getAllChallenges();
  
  // Filtrer les défis du créateur selon SES préférences
  const creatorChallengesFiltered = applyFiltersForPlayer(
    allChallenges.filter((c) => c.gender === creatorGender),
    creatorPreferences,
    maxLevel
  );
  
  // Filtrer les défis du partenaire selon SES préférences
  const partnerChallengesFiltered = applyFiltersForPlayer(
    allChallenges.filter((c) => c.gender === partnerGender),
    partnerPreferences,
    maxLevel
  );

  // Mélanger les pools
  const creatorPool = shuffleArray(creatorChallengesFiltered);
  const partnerPool = shuffleArray(partnerChallengesFiltered);

  // Vérifier si assez de défis
  const creatorCount = distribution.filter((d) => d.forPlayer === "creator").length;
  const partnerCount = distribution.filter((d) => d.forPlayer === "partner").length;

  if (creatorPool.length < creatorCount) {
    warnings.push(
      `Pas assez de défis pour le créateur avec ses préférences (${creatorPool.length}/${creatorCount}). Thèmes: ${creatorPreferences.selectedThemes.join(", ")}`
    );
  }
  if (partnerPool.length < partnerCount) {
    warnings.push(
      `Pas assez de défis pour le partenaire avec ses préférences (${partnerPool.length}/${partnerCount}). Thèmes: ${partnerPreferences.selectedThemes.join(", ")}`
    );
  }

  // Pools par niveau pour une sélection optimisée
  const creatorByLevel: Record<IntensityLevel, ExtendedChallengeTemplate[]> = {
    1: shuffleArray(creatorPool.filter((c) => c.level === 1)),
    2: shuffleArray(creatorPool.filter((c) => c.level === 2)),
    3: shuffleArray(creatorPool.filter((c) => c.level === 3)),
    4: shuffleArray(creatorPool.filter((c) => c.level === 4)),
  };

  const partnerByLevel: Record<IntensityLevel, ExtendedChallengeTemplate[]> = {
    1: shuffleArray(partnerPool.filter((c) => c.level === 1)),
    2: shuffleArray(partnerPool.filter((c) => c.level === 2)),
    3: shuffleArray(partnerPool.filter((c) => c.level === 3)),
    4: shuffleArray(partnerPool.filter((c) => c.level === 4)),
  };

  // Sélectionner les défis selon la distribution
  const selectedChallenges: SessionChallenge[] = [];
  const usedIds = new Set<string>();

  for (const { position, level, forPlayer } of distribution) {
    const pool = forPlayer === "creator" ? creatorByLevel : partnerByLevel;
    const gender = forPlayer === "creator" ? creatorGender : partnerGender;

    // Chercher un défi au niveau cible
    let challenge = findAvailableChallenge(pool, level, usedIds, maxLevel);

    if (!challenge) {
      // Si pas de défi disponible, warning
      warnings.push(
        `Position ${position}: Pas de défi disponible pour ${forPlayer} niveau ${level}`
      );
      continue;
    }

    usedIds.add(challenge.id);

    // Convertir en SessionChallenge (compatible avec le type existant)
    const sessionChallenge: SessionChallenge = {
      text: challenge.text,
      level: challenge.level,
      type: challenge.type,
      forGender: gender,
      forPlayer,
      completed: false,
      completedBy: null,
      completedAt: null,
    };

    selectedChallenges.push(sessionChallenge);
  }

  // Calculer les statistiques
  const stats = calculateStats(selectedChallenges);

  return {
    challenges: selectedChallenges,
    stats,
    warnings,
  };
}

/**
 * Trouve un défi disponible avec fallback sur les niveaux adjacents
 */
function findAvailableChallenge(
  pool: Record<IntensityLevel, ExtendedChallengeTemplate[]>,
  targetLevel: IntensityLevel,
  usedIds: Set<string>,
  maxLevel: IntensityLevel
): ExtendedChallengeTemplate | null {
  // Essayer le niveau cible
  const targetChallenge = pool[targetLevel].find((c) => !usedIds.has(c.id));
  if (targetChallenge) {
    // Retirer du pool
    pool[targetLevel] = pool[targetLevel].filter((c) => c.id !== targetChallenge.id);
    return targetChallenge;
  }

  // Fallback : niveau inférieur
  for (let level = targetLevel - 1; level >= 1; level--) {
    const challenge = pool[level as IntensityLevel].find((c) => !usedIds.has(c.id));
    if (challenge) {
      pool[level as IntensityLevel] = pool[level as IntensityLevel].filter(
        (c) => c.id !== challenge.id
      );
      return challenge;
    }
  }

  // Fallback : niveau supérieur
  for (let level = targetLevel + 1; level <= maxLevel; level++) {
    const challenge = pool[level as IntensityLevel].find((c) => !usedIds.has(c.id));
    if (challenge) {
      pool[level as IntensityLevel] = pool[level as IntensityLevel].filter(
        (c) => c.id !== challenge.id
      );
      return challenge;
    }
  }

  return null;
}

/**
 * Calcule les statistiques de la sélection
 */
function calculateStats(challenges: SessionChallenge[]): SelectionResult["stats"] {
  const byLevel: Record<IntensityLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byType: Record<ChallengeType, number> = {
    audio: 0,
    video: 0,
    photo: 0,
    texte: 0,
  };
  const byPlayer: Record<PlayerRole, number> = { creator: 0, partner: 0 };

  for (const challenge of challenges) {
    byLevel[challenge.level]++;
    byType[challenge.type]++;
    byPlayer[challenge.forPlayer]++;
  }

  return {
    total: challenges.length,
    byLevel,
    byType,
    byPlayer,
    withToys: 0, // Non trackable depuis SessionChallenge
  };
}

// ============================================================
// FONCTION POUR OBTENIR 2 ALTERNATIVES (SPEC GAME-MECHANICS.md)
// ============================================================

/**
 * Retourne 2 alternatives pour changer un défi
 * PROMPT 1.3-v3 : Utilise les préférences du joueur concerné
 * 
 * Selon GAME-MECHANICS.md :
 * - Même niveau d'intensité que le défi actuel
 * - Même genre que le défi actuel
 * - Type de média différent si possible (pour varier)
 * - N'ont pas été utilisés dans la session
 * - Respecte les préférences du joueur concerné
 */
export function getAlternatives(
  currentChallenges: SessionChallenge[],
  indexToReplace: number,
  config: SelectionConfig
): ChallengeAlternatives {
  const challengeToReplace = currentChallenges[indexToReplace];
  
  if (!challengeToReplace) {
    return { alternatives: [], availableCount: 0 };
  }

  const { forPlayer, level, forGender, type: currentType } = challengeToReplace;
  const maxLevel = getMaxLevel(config.isPremium);

  // ============================================================
  // UTILISER LES PRÉFÉRENCES DU JOUEUR CONCERNÉ (PROMPT 1.3-v3)
  // ============================================================
  const playerPreferences = forPlayer === "creator" 
    ? config.creatorPreferences 
    : config.partnerPreferences;

  // Charger et filtrer les défis selon les préférences du joueur
  const allChallenges = getAllChallenges();
  const filteredChallenges = applyFiltersForPlayer(
    allChallenges.filter((c) => c.gender === forGender),
    playerPreferences,
    maxLevel
  );

  // Filtrer par niveau (même que le défi actuel)
  const candidates = filteredChallenges.filter((c) => c.level === level);

  // Exclure les défis déjà utilisés dans la session
  const usedTexts = new Set(currentChallenges.map((c) => c.text));
  const available = candidates.filter((c) => !usedTexts.has(c.text));

  if (available.length === 0) {
    return { alternatives: [], availableCount: 0 };
  }

  // Prioriser les défis avec un type différent pour varier
  const differentType = shuffleArray(
    available.filter((c) => c.type !== currentType)
  );
  const sameType = shuffleArray(
    available.filter((c) => c.type === currentType)
  );

  // Combiner : d'abord les types différents, puis les mêmes types
  const sortedCandidates = [...differentType, ...sameType];

  // Prendre les 2 premiers
  const selectedAlternatives = sortedCandidates.slice(0, 2);

  // Convertir en SessionChallenge
  const alternatives: SessionChallenge[] = selectedAlternatives.map((selected) => ({
    text: selected.text,
    level: selected.level,
    type: selected.type,
    forGender,
    forPlayer,
    completed: false,
    completedBy: null,
    completedAt: null,
  }));

  return {
    alternatives,
    availableCount: available.length,
  };
}

// ============================================================
// FONCTIONS UTILITAIRES POUR LE JEU
// ============================================================

/**
 * Compte les défis restants par joueur
 */
export function countRemainingChallenges(
  challenges: SessionChallenge[],
  playerRole: PlayerRole
): number {
  return challenges.filter(
    (c) => c.forPlayer === playerRole && !c.completed
  ).length;
}

/**
 * Récupère la complétion par niveau
 */
export function getCompletionByLevel(
  challenges: SessionChallenge[]
): Record<IntensityLevel, { completed: number; total: number }> {
  const result: Record<IntensityLevel, { completed: number; total: number }> = {
    1: { completed: 0, total: 0 },
    2: { completed: 0, total: 0 },
    3: { completed: 0, total: 0 },
    4: { completed: 0, total: 0 },
  };

  for (const challenge of challenges) {
    result[challenge.level].total++;
    if (challenge.completed) {
      result[challenge.level].completed++;
    }
  }

  return result;
}

/**
 * Vérifie si un niveau est complété
 */
export function isLevelCompleted(
  challenges: SessionChallenge[],
  level: IntensityLevel
): boolean {
  const levelChallenges = challenges.filter((c) => c.level === level);
  if (levelChallenges.length === 0) return false;
  return levelChallenges.every((c) => c.completed);
}

/**
 * Trouve le prochain défi en attente
 */
export function getNextPendingChallenge(
  challenges: SessionChallenge[],
  startIndex: number = 0
): { challenge: SessionChallenge; index: number } | null {
  for (let i = startIndex; i < challenges.length; i++) {
    if (!challenges[i].completed) {
      return { challenge: challenges[i], index: i };
    }
  }
  return null;
}

/**
 * Calcule la progression globale
 */
export function calculateProgress(challenges: SessionChallenge[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = challenges.filter((c) => c.completed).length;
  const total = challenges.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Compte les défis disponibles avant sélection (pour preview)
 * PROMPT 1.3-v3 : Par joueur avec leurs préférences
 */
export function countAvailableChallenges(config: SelectionConfig): {
  creator: Record<IntensityLevel, number>;
  partner: Record<IntensityLevel, number>;
  total: number;
} {
  const maxLevel = getMaxLevel(config.isPremium);
  const allChallenges = getAllChallenges();

  // Filtrer selon les préférences de chaque joueur
  const creatorChallenges = applyFiltersForPlayer(
    allChallenges.filter((c) => c.gender === config.creatorGender),
    config.creatorPreferences,
    maxLevel
  );
  const partnerChallenges = applyFiltersForPlayer(
    allChallenges.filter((c) => c.gender === config.partnerGender),
    config.partnerPreferences,
    maxLevel
  );

  const countByLevel = (
    challenges: ExtendedChallengeTemplate[]
  ): Record<IntensityLevel, number> => ({
    1: challenges.filter((c) => c.level === 1).length,
    2: challenges.filter((c) => c.level === 2).length,
    3: challenges.filter((c) => c.level === 3).length,
    4: challenges.filter((c) => c.level === 4).length,
  });

  return {
    creator: countByLevel(creatorChallenges),
    partner: countByLevel(partnerChallenges),
    total: creatorChallenges.length + partnerChallenges.length,
  };
}

/**
 * Retourne le nombre de défis par niveau
 */
export function getChallengeCountByLevel(level: IntensityLevel): number {
  return (
    CHALLENGES_MAP[level].homme.length + CHALLENGES_MAP[level].femme.length
  );
}

/**
 * Vérifie si un joueur peut encore changer de défi
 */
export function canChangeChallenge(
  changesUsed: number,
  bonusChanges: number,
  isPremium: boolean
): { canChange: boolean; remainingChanges: number } {
  if (isPremium) {
    return { canChange: true, remainingChanges: Infinity };
  }

  const maxChanges = 3 + bonusChanges; // 3 de base + bonus via pub
  const remaining = maxChanges - changesUsed;

  return {
    canChange: remaining > 0,
    remainingChanges: Math.max(0, remaining),
  };
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  selectChallenges,
  getAlternatives,
  isLevelAccessible,
  getAccessibleLevels,
  countRemainingChallenges,
  getCompletionByLevel,
  isLevelCompleted,
  getNextPendingChallenge,
  calculateProgress,
  countAvailableChallenges,
  getChallengeCountByLevel,
  canChangeChallenge,
  DEFAULT_PLAYER_PREFERENCES,
};