/**
 * Algorithme de sélection des défis pour Intimacy Play
 *
 * Fonctionnalités :
 * - Filtrage par thèmes sélectionnés
 * - Filtrage par jouets disponibles
 * - Filtrage par préférences média (photo/audio/video)
 * - Progression d'intensité (0-40% niveau de départ, 40-70% +1, etc.)
 * - Alternance créateur/partenaire
 * - Gestion des couples de même genre via forPlayer
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
 * Configuration pour la sélection des défis
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
  /** Thèmes sélectionnés (vide = tous) */
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
  // Si aucun thème sélectionné, inclure tous
  if (selectedThemes.length === 0) {
    return challenges;
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

// ============================================================
// FONCTION DE SÉLECTION PRINCIPALE
// ============================================================

/**
 * Sélectionne les défis selon la configuration
 */
export function selectChallenges(config: SelectionConfig): SelectionResult {
  const {
    creatorGender,
    partnerGender,
    count,
    startIntensity,
    isPremium,
    selectedThemes,
    includeToys,
    availableToys,
    mediaPreferences,
  } = config;

  const warnings: string[] = [];
  const maxLevel = getMaxLevel(isPremium);

  // Calculer la distribution de progression
  const distribution = calculateProgressionDistribution(
    count,
    startIntensity,
    maxLevel
  );

  // Charger tous les défis
  let allChallenges = getAllChallenges();

  // Appliquer les filtres
  allChallenges = filterByThemes(allChallenges, selectedThemes);
  allChallenges = filterByToys(allChallenges, includeToys, availableToys);
  allChallenges = filterByMedia(allChallenges, mediaPreferences);
  allChallenges = filterByMaxLevel(allChallenges, maxLevel);

  // Séparer par genre
  const creatorPool = shuffleArray(
    allChallenges.filter((c) => c.gender === creatorGender)
  );
  const partnerPool = shuffleArray(
    allChallenges.filter((c) => c.gender === partnerGender)
  );

  // Vérifier si assez de défis
  const creatorCount = distribution.filter((d) => d.forPlayer === "creator").length;
  const partnerCount = distribution.filter((d) => d.forPlayer === "partner").length;

  if (creatorPool.length < creatorCount) {
    warnings.push(
      `Pas assez de défis pour le créateur (${creatorPool.length}/${creatorCount})`
    );
  }
  if (partnerPool.length < partnerCount) {
    warnings.push(
      `Pas assez de défis pour le partenaire (${partnerPool.length}/${partnerCount})`
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
// FONCTIONS UTILITAIRES POUR LE JEU
// ============================================================

/**
 * Obtient un défi de remplacement
 */
export function getReplacementChallenge(
  currentChallenges: SessionChallenge[],
  indexToReplace: number,
  config: SelectionConfig
): SessionChallenge | null {
  const challengeToReplace = currentChallenges[indexToReplace];
  if (!challengeToReplace) return null;

  const { forPlayer, level, forGender } = challengeToReplace;

  // Charger tous les défis
  let allChallenges = getAllChallenges();

  // Appliquer les mêmes filtres
  allChallenges = filterByThemes(allChallenges, config.selectedThemes);
  allChallenges = filterByToys(allChallenges, config.includeToys, config.availableToys);
  allChallenges = filterByMedia(allChallenges, config.mediaPreferences);
  allChallenges = filterByMaxLevel(allChallenges, getMaxLevel(config.isPremium));

  // Filtrer par genre et niveau
  const candidates = allChallenges.filter(
    (c) => c.gender === forGender && c.level === level
  );

  // Exclure les défis déjà utilisés
  const usedTexts = new Set(currentChallenges.map((c) => c.text));
  const available = candidates.filter((c) => !usedTexts.has(c.text));

  if (available.length === 0) {
    return null;
  }

  // Sélectionner aléatoirement
  const selected = available[Math.floor(Math.random() * available.length)];

  return {
    text: selected.text,
    level: selected.level,
    type: selected.type,
    forGender,
    forPlayer,
    completed: false,
    completedBy: null,
    completedAt: null,
  };
}

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
 */
export function countAvailableChallenges(config: SelectionConfig): {
  creator: Record<IntensityLevel, number>;
  partner: Record<IntensityLevel, number>;
  total: number;
} {
  const maxLevel = getMaxLevel(config.isPremium);

  let allChallenges = getAllChallenges();
  allChallenges = filterByThemes(allChallenges, config.selectedThemes);
  allChallenges = filterByToys(allChallenges, config.includeToys, config.availableToys);
  allChallenges = filterByMedia(allChallenges, config.mediaPreferences);
  allChallenges = filterByMaxLevel(allChallenges, maxLevel);

  const creatorChallenges = allChallenges.filter(
    (c) => c.gender === config.creatorGender
  );
  const partnerChallenges = allChallenges.filter(
    (c) => c.gender === config.partnerGender
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
    total: allChallenges.length,
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

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  selectChallenges,
  isLevelAccessible,
  getAccessibleLevels,
  getReplacementChallenge,
  countRemainingChallenges,
  getCompletionByLevel,
  isLevelCompleted,
  getNextPendingChallenge,
  calculateProgress,
  countAvailableChallenges,
  getChallengeCountByLevel,
};