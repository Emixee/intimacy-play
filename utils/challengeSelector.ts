/**
 * Utilitaires de sélection de défis
 * 
 * NOTE: Les fonctions principales de sélection sont dans data/challenges.ts
 * Ce fichier contient des utilitaires supplémentaires.
 */

// Réexporter les fonctions principales depuis data/challenges.ts
export { 
  selectChallenges,
  getChallengeCountByLevel,
  isLevelAccessible,
  getAccessibleLevels,
  getChallengeStats,
} from '../data/challenges';

import type { 
  IntensityLevel, 
  SessionChallenge,
  PlayerRole,
} from '../types';

// ============================================================
// FONCTIONS UTILITAIRES ADDITIONNELLES
// ============================================================

/**
 * Récupère un défi de remplacement pour un joueur
 * 
 * @param currentChallenges - Liste des défis de la session
 * @param currentIndex - Index du défi actuel
 * @param playerRole - Rôle du joueur (creator/partner)
 * @returns Le prochain défi disponible ou null
 */
export const getReplacementChallenge = (
  currentChallenges: SessionChallenge[],
  currentIndex: number,
  playerRole: PlayerRole
): SessionChallenge | null => {
  // Chercher un défi non complété du même joueur plus loin dans la liste
  const currentChallenge = currentChallenges[currentIndex];
  
  for (let i = currentIndex + 1; i < currentChallenges.length; i++) {
    const challenge = currentChallenges[i];
    if (
      challenge.forPlayer === playerRole &&
      !challenge.completed &&
      challenge.level === currentChallenge.level
    ) {
      return challenge;
    }
  }

  // Si pas trouvé au même niveau, chercher au niveau supérieur
  for (let i = currentIndex + 1; i < currentChallenges.length; i++) {
    const challenge = currentChallenges[i];
    if (
      challenge.forPlayer === playerRole &&
      !challenge.completed
    ) {
      return challenge;
    }
  }

  return null;
};

/**
 * Compte le nombre de défis restants pour un joueur
 */
export const countRemainingChallenges = (
  challenges: SessionChallenge[],
  playerRole: PlayerRole
): number => {
  return challenges.filter(
    (c) => c.forPlayer === playerRole && !c.completed
  ).length;
};

/**
 * Compte le nombre de défis complétés par niveau
 */
export const getCompletionByLevel = (
  challenges: SessionChallenge[]
): Record<IntensityLevel, { completed: number; total: number }> => {
  const result: Record<IntensityLevel, { completed: number; total: number }> = {
    1: { completed: 0, total: 0 },
    2: { completed: 0, total: 0 },
    3: { completed: 0, total: 0 },
    4: { completed: 0, total: 0 },
  };

  challenges.forEach((challenge) => {
    result[challenge.level].total++;
    if (challenge.completed) {
      result[challenge.level].completed++;
    }
  });

  return result;
};

/**
 * Vérifie si tous les défis d'un niveau sont complétés
 */
export const isLevelCompleted = (
  challenges: SessionChallenge[],
  level: IntensityLevel
): boolean => {
  const levelChallenges = challenges.filter((c) => c.level === level);
  return levelChallenges.length > 0 && levelChallenges.every((c) => c.completed);
};

/**
 * Récupère le prochain défi non complété
 */
export const getNextPendingChallenge = (
  challenges: SessionChallenge[],
  startIndex: number = 0
): { challenge: SessionChallenge; index: number } | null => {
  for (let i = startIndex; i < challenges.length; i++) {
    if (!challenges[i].completed) {
      return { challenge: challenges[i], index: i };
    }
  }
  return null;
};

/**
 * Calcule le pourcentage de progression
 */
export const calculateProgress = (challenges: SessionChallenge[]): number => {
  if (challenges.length === 0) return 0;
  const completed = challenges.filter((c) => c.completed).length;
  return Math.round((completed / challenges.length) * 100);
};
