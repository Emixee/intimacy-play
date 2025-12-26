/**
 * Lazy Loading des défis - VERSION OPTIMISÉE
 * 
 * Au lieu de charger 67KB de défis au démarrage,
 * on charge uniquement les niveaux nécessaires à la demande.
 * 
 * Avantages :
 * - Réduction du temps de démarrage
 * - Moins de mémoire utilisée
 * - Bundle initial plus léger
 */

import { ChallengeType } from "../types";

// ============================================================
// TYPE LOCAL
// ============================================================

export interface ChallengeData {
  text: string;
  type: ChallengeType;
  theme: string;
}

export type Gender = "homme" | "femme";
export type IntensityLevel = 1 | 2 | 3 | 4;

// ============================================================
// CACHE DES DÉFIS CHARGÉS
// ============================================================

const challengesCache: Map<string, ChallengeData[]> = new Map();

// ============================================================
// FONCTIONS DE CHARGEMENT LAZY
// ============================================================

/**
 * Charge les défis pour un niveau et genre spécifiques
 * Utilise un cache pour éviter les rechargements
 */
export async function loadChallenges(
  level: IntensityLevel,
  gender: Gender
): Promise<ChallengeData[]> {
  const cacheKey = `${level}_${gender.toUpperCase()}`;
  
  // Retourner du cache si disponible
  if (challengesCache.has(cacheKey)) {
    return challengesCache.get(cacheKey)!;
  }

  // Charger dynamiquement le module approprié
  let challenges: ChallengeData[];
  
  try {
    const module = await import("./challenges");
    
    switch (cacheKey) {
      case "1_HOMME":
        challenges = module.CHALLENGES_N1_HOMME;
        break;
      case "1_FEMME":
        challenges = module.CHALLENGES_N1_FEMME;
        break;
      case "2_HOMME":
        challenges = module.CHALLENGES_N2_HOMME;
        break;
      case "2_FEMME":
        challenges = module.CHALLENGES_N2_FEMME;
        break;
      case "3_HOMME":
        challenges = module.CHALLENGES_N3_HOMME;
        break;
      case "3_FEMME":
        challenges = module.CHALLENGES_N3_FEMME;
        break;
      case "4_HOMME":
        challenges = module.CHALLENGES_N4_HOMME;
        break;
      case "4_FEMME":
        challenges = module.CHALLENGES_N4_FEMME;
        break;
      default:
        challenges = [];
    }
    
    // Mettre en cache
    challengesCache.set(cacheKey, challenges);
    
    return challenges;
  } catch (error) {
    console.error(`[ChallengesLoader] Erreur chargement ${cacheKey}:`, error);
    return [];
  }
}

/**
 * Précharge les défis pour plusieurs niveaux
 * Utile avant de créer une session
 */
export async function preloadChallenges(
  levels: IntensityLevel[],
  genders: Gender[]
): Promise<void> {
  const promises: Promise<ChallengeData[]>[] = [];
  
  for (const level of levels) {
    for (const gender of genders) {
      promises.push(loadChallenges(level, gender));
    }
  }
  
  await Promise.all(promises);
}

/**
 * Charge tous les défis d'un coup (fallback)
 * À utiliser seulement si nécessaire
 */
export async function loadAllChallenges(): Promise<Record<string, ChallengeData[]>> {
  const levels: IntensityLevel[] = [1, 2, 3, 4];
  const genders: Gender[] = ["homme", "femme"];
  
  await preloadChallenges(levels, genders);
  
  const result: Record<string, ChallengeData[]> = {};
  
  for (const level of levels) {
    for (const gender of genders) {
      const key = `${level}_${gender.toUpperCase()}`;
      result[key] = challengesCache.get(key) || [];
    }
  }
  
  return result;
}

/**
 * Vide le cache (utile pour libérer la mémoire)
 */
export function clearChallengesCache(): void {
  challengesCache.clear();
}

/**
 * Retourne la taille du cache
 */
export function getCacheSize(): number {
  let size = 0;
  challengesCache.forEach((challenges) => {
    size += challenges.length;
  });
  return size;
}

// ============================================================
// MAP SYNCHRONE (pour compatibilité avec code existant)
// ============================================================

/**
 * Retourne la map des défis déjà chargés
 * ATTENTION: Ne contient que les défis déjà en cache
 */
export function getChallengesMap(): Record<string, ChallengeData[]> {
  const result: Record<string, ChallengeData[]> = {};
  
  challengesCache.forEach((challenges, key) => {
    result[key] = challenges;
  });
  
  return result;
}
