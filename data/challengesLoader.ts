/**
 * Lazy Loading des défis - VERSION CORRIGÉE
 * 
 * Compatible avec le wrapper challengesData.ts existant
 * qui enrichit les défis avec : id, hasToy, toyName
 * 
 * Avantages :
 * - Réduction du temps de démarrage
 * - Moins de mémoire utilisée
 * - Conserve toutes les fonctions du wrapper
 */

import type {
  Gender,
  IntensityLevel,
  ChallengeType,
} from "../types";

// ============================================================
// TYPES (identiques à challengesData.ts)
// ============================================================

/**
 * Template de défi étendu avec support jouets
 */
export interface ExtendedChallengeTemplate {
  id: string;
  text: string;
  level: IntensityLevel;
  gender: Gender;
  type: ChallengeType;
  theme: string;
  hasToy: boolean;
  toyName: string | null;
}

// ============================================================
// CACHE DES DÉFIS CHARGÉS
// ============================================================

let challengesModule: typeof import("./challengesData") | null = null;
let isLoaded = false;

// ============================================================
// CHARGEMENT LAZY DU MODULE
// ============================================================

/**
 * Charge le module challengesData de manière lazy
 * Une seule fois, puis mis en cache
 */
async function ensureLoaded(): Promise<typeof import("./challengesData")> {
  if (challengesModule && isLoaded) {
    return challengesModule;
  }

  // Import dynamique du wrapper complet
  challengesModule = await import("./challengesData");
  isLoaded = true;
  
  return challengesModule;
}

// ============================================================
// FONCTIONS DE CHARGEMENT LAZY
// ============================================================

/**
 * Charge les défis pour un niveau et genre spécifiques
 * Retourne des ExtendedChallengeTemplate (avec id, hasToy, etc.)
 */
export async function loadChallenges(
  level: IntensityLevel,
  gender: Gender
): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.CHALLENGES_MAP[level][gender];
}

/**
 * Précharge tous les défis en mémoire
 */
export async function preloadAllChallenges(): Promise<void> {
  await ensureLoaded();
}

/**
 * Récupère tous les défis (lazy)
 */
export async function getAllChallengesLazy(): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getAllChallenges();
}

/**
 * Récupère les défis par niveau (lazy)
 */
export async function getChallengesByLevelLazy(
  level: IntensityLevel
): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getChallengesByLevel(level);
}

/**
 * Récupère les défis par genre (lazy)
 */
export async function getChallengesByGenderLazy(
  gender: Gender
): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getChallengesByGender(gender);
}

/**
 * Récupère les défis par thème (lazy)
 */
export async function getChallengesByThemeLazy(
  theme: string
): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getChallengesByTheme(theme);
}

/**
 * Récupère les défis avec un jouet spécifique (lazy)
 */
export async function getChallengesWithToyLazy(
  toyName: string
): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getChallengesWithToy(toyName);
}

/**
 * Récupère les défis sans jouet (lazy)
 */
export async function getChallengesWithoutToyLazy(): Promise<ExtendedChallengeTemplate[]> {
  const module = await ensureLoaded();
  return module.getChallengesWithoutToy();
}

/**
 * Récupère les statistiques (lazy)
 */
export async function getChallengeStatsLazy() {
  const module = await ensureLoaded();
  return module.getChallengeStats();
}

/**
 * Récupère tous les thèmes (lazy)
 */
export async function getAllThemesLazy(): Promise<string[]> {
  const module = await ensureLoaded();
  return module.getAllThemes();
}

/**
 * Récupère tous les jouets (lazy)
 */
export async function getAllToysLazy(): Promise<string[]> {
  const module = await ensureLoaded();
  return module.getAllToys();
}

// ============================================================
// ACCÈS SYNCHRONE (après préchargement)
// ============================================================

/**
 * Vérifie si les défis sont chargés
 */
export function isChallengesLoaded(): boolean {
  return isLoaded;
}

/**
 * Accès synchrone au module (ATTENTION: retourne null si pas chargé)
 * À utiliser uniquement après preloadAllChallenges()
 */
export function getChallengesModuleSync() {
  if (!isLoaded || !challengesModule) {
    console.warn("[ChallengesLoader] Module not loaded! Call preloadAllChallenges() first.");
    return null;
  }
  return challengesModule;
}

/**
 * Accès synchrone à la MAP (ATTENTION: retourne null si pas chargé)
 */
export function getChallengesMapSync() {
  const module = getChallengesModuleSync();
  return module?.CHALLENGES_MAP || null;
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  loadChallenges,
  preloadAllChallenges,
  getAllChallengesLazy,
  getChallengesByLevelLazy,
  getChallengesByGenderLazy,
  getChallengesByThemeLazy,
  getChallengesWithToyLazy,
  getChallengesWithoutToyLazy,
  getChallengeStatsLazy,
  getAllThemesLazy,
  getAllToysLazy,
  isChallengesLoaded,
  getChallengesModuleSync,
  getChallengesMapSync,
};
