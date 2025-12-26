/**
 * Hook pour charger les défis avec lazy loading
 * 
 * Optimisations :
 * - Charge les défis à la demande
 * - Cache automatique
 * - Gestion d'erreurs
 * - État de chargement
 */

import { useState, useCallback, useEffect } from "react";
import { 
  loadChallenges, 
  preloadChallenges, 
  ChallengeData,
  Gender,
  IntensityLevel,
} from "../data/challengesLoader";

interface UseChallengesOptions {
  /** Précharger automatiquement au montage */
  preload?: boolean;
  /** Niveaux à précharger */
  preloadLevels?: IntensityLevel[];
  /** Genres à précharger */
  preloadGenders?: Gender[];
}

interface UseChallengesReturn {
  /** Charger des défis spécifiques */
  loadChallengesForLevel: (level: IntensityLevel, gender: Gender) => Promise<ChallengeData[]>;
  /** Précharger plusieurs niveaux */
  preloadMultiple: (levels: IntensityLevel[], genders: Gender[]) => Promise<void>;
  /** État de chargement */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Défis chargés (cache local) */
  challenges: Map<string, ChallengeData[]>;
}

export function useChallenges(options: UseChallengesOptions = {}): UseChallengesReturn {
  const {
    preload = false,
    preloadLevels = [1, 2],
    preloadGenders = ["homme", "femme"],
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Map<string, ChallengeData[]>>(new Map());

  // Charger des défis pour un niveau/genre
  const loadChallengesForLevel = useCallback(async (
    level: IntensityLevel,
    gender: Gender
  ): Promise<ChallengeData[]> => {
    const cacheKey = `${level}_${gender.toUpperCase()}`;
    
    // Vérifier le cache local
    if (challenges.has(cacheKey)) {
      return challenges.get(cacheKey)!;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await loadChallenges(level, gender);
      
      // Mettre à jour le cache local
      setChallenges(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, data);
        return newMap;
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [challenges]);

  // Précharger plusieurs niveaux
  const preloadMultiple = useCallback(async (
    levels: IntensityLevel[],
    genders: Gender[]
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await preloadChallenges(levels, genders);

      // Mettre à jour le cache local
      const newMap = new Map(challenges);
      for (const level of levels) {
        for (const gender of genders) {
          const cacheKey = `${level}_${gender.toUpperCase()}`;
          const data = await loadChallenges(level, gender);
          newMap.set(cacheKey, data);
        }
      }
      setChallenges(newMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de préchargement";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [challenges]);

  // Préchargement automatique au montage
  useEffect(() => {
    if (preload) {
      preloadMultiple(preloadLevels, preloadGenders);
    }
  }, [preload]); // Volontairement limité pour éviter les boucles

  return {
    loadChallengesForLevel,
    preloadMultiple,
    isLoading,
    error,
    challenges,
  };
}

/**
 * Hook simplifié pour obtenir les défis d'un niveau
 */
export function useLevelChallenges(level: IntensityLevel, gender: Gender) {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await loadChallenges(level, gender);
        if (mounted) {
          setChallenges(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [level, gender]);

  return { challenges, isLoading, error };
}
