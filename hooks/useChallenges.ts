/**
 * Hook pour charger les défis avec lazy loading
 * 
 * Compatible avec le wrapper challengesData.ts
 * Retourne des ExtendedChallengeTemplate (avec id, hasToy, toyName)
 */

import { useState, useCallback, useEffect } from "react";
import { 
  loadChallenges, 
  preloadAllChallenges,
  getAllChallengesLazy,
  getChallengesByThemeLazy,
  getChallengesWithToyLazy,
  getChallengesWithoutToyLazy,
  getAllThemesLazy,
  getAllToysLazy,
  isChallengesLoaded,
  ExtendedChallengeTemplate,
} from "../data/challengesLoader";

import type { Gender, IntensityLevel } from "../types";

// ============================================================
// HOOK PRINCIPAL
// ============================================================

interface UseChallengesOptions {
  /** Précharger automatiquement au montage */
  preload?: boolean;
}

interface UseChallengesReturn {
  /** Charger des défis pour un niveau/genre */
  loadChallengesForLevel: (level: IntensityLevel, gender: Gender) => Promise<ExtendedChallengeTemplate[]>;
  /** Précharger tous les défis */
  preloadAll: () => Promise<void>;
  /** Récupérer tous les défis */
  getAllChallenges: () => Promise<ExtendedChallengeTemplate[]>;
  /** Récupérer les défis par thème */
  getChallengesByTheme: (theme: string) => Promise<ExtendedChallengeTemplate[]>;
  /** Récupérer les défis avec un jouet */
  getChallengesWithToy: (toyName: string) => Promise<ExtendedChallengeTemplate[]>;
  /** Récupérer les défis sans jouet */
  getChallengesWithoutToy: () => Promise<ExtendedChallengeTemplate[]>;
  /** Récupérer tous les thèmes */
  getAllThemes: () => Promise<string[]>;
  /** Récupérer tous les jouets */
  getAllToys: () => Promise<string[]>;
  /** État de chargement */
  isLoading: boolean;
  /** Les défis sont-ils chargés ? */
  isLoaded: boolean;
  /** Erreur éventuelle */
  error: string | null;
}

export function useChallenges(options: UseChallengesOptions = {}): UseChallengesReturn {
  const { preload = false } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(isChallengesLoaded());

  // Charger les défis pour un niveau/genre
  const loadChallengesForLevel = useCallback(async (
    level: IntensityLevel,
    gender: Gender
  ): Promise<ExtendedChallengeTemplate[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await loadChallenges(level, gender);
      setIsLoaded(true);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Précharger tous les défis
  const preloadAll = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await preloadAllChallenges();
      setIsLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de préchargement";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Wrapper pour getAllChallenges
  const getAllChallenges = useCallback(async (): Promise<ExtendedChallengeTemplate[]> => {
    setIsLoading(true);
    try {
      const data = await getAllChallengesLazy();
      setIsLoaded(true);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Wrapper pour getChallengesByTheme
  const getChallengesByTheme = useCallback(async (theme: string): Promise<ExtendedChallengeTemplate[]> => {
    try {
      return await getChallengesByThemeLazy(theme);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    }
  }, []);

  // Wrapper pour getChallengesWithToy
  const getChallengesWithToy = useCallback(async (toyName: string): Promise<ExtendedChallengeTemplate[]> => {
    try {
      return await getChallengesWithToyLazy(toyName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    }
  }, []);

  // Wrapper pour getChallengesWithoutToy
  const getChallengesWithoutToy = useCallback(async (): Promise<ExtendedChallengeTemplate[]> => {
    try {
      return await getChallengesWithoutToyLazy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    }
  }, []);

  // Wrapper pour getAllThemes
  const getAllThemes = useCallback(async (): Promise<string[]> => {
    try {
      return await getAllThemesLazy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    }
  }, []);

  // Wrapper pour getAllToys
  const getAllToys = useCallback(async (): Promise<string[]> => {
    try {
      return await getAllToysLazy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return [];
    }
  }, []);

  // Préchargement automatique au montage
  useEffect(() => {
    if (preload && !isLoaded) {
      preloadAll();
    }
  }, [preload, isLoaded, preloadAll]);

  return {
    loadChallengesForLevel,
    preloadAll,
    getAllChallenges,
    getChallengesByTheme,
    getChallengesWithToy,
    getChallengesWithoutToy,
    getAllThemes,
    getAllToys,
    isLoading,
    isLoaded,
    error,
  };
}

// ============================================================
// HOOK SIMPLIFIÉ POUR UN NIVEAU/GENRE
// ============================================================

/**
 * Hook simplifié pour obtenir les défis d'un niveau/genre spécifique
 */
export function useLevelChallenges(level: IntensityLevel, gender: Gender) {
  const [challenges, setChallenges] = useState<ExtendedChallengeTemplate[]>([]);
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

// ============================================================
// HOOK POUR LES THÈMES
// ============================================================

/**
 * Hook pour obtenir tous les thèmes disponibles
 */
export function useThemes() {
  const [themes, setThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getAllThemesLazy();
        if (mounted) {
          setThemes(data);
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
  }, []);

  return { themes, isLoading, error };
}

// ============================================================
// HOOK POUR LES JOUETS
// ============================================================

/**
 * Hook pour obtenir tous les jouets disponibles
 */
export function useToys() {
  const [toys, setToys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getAllToysLazy();
        if (mounted) {
          setToys(data);
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
  }, []);

  return { toys, isLoading, error };
}
