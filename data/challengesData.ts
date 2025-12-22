/**
 * Wrapper pour enrichir les défis existants avec la structure étendue
 *
 * Ce fichier :
 * 1. Importe les défis existants depuis challenges.ts
 * 2. Ajoute automatiquement : id, hasToy, toyName
 * 3. Détecte les jouets mentionnés dans le texte des défis
 *
 * Structure étendue :
 * - id: Identifiant unique (format: n{level}_{h/f}_{numero})
 * - hasToy: Si le défi nécessite un jouet (détecté automatiquement)
 * - toyName: Nom du jouet si applicable
 */

import type {
  Gender,
  IntensityLevel,
  ChallengeType,
} from "../types";

// Import des défis existants
import {
  CHALLENGES_N1_HOMME as RAW_N1_H,
  CHALLENGES_N1_FEMME as RAW_N1_F,
  CHALLENGES_N2_HOMME as RAW_N2_H,
  CHALLENGES_N2_FEMME as RAW_N2_F,
  CHALLENGES_N3_HOMME as RAW_N3_H,
  CHALLENGES_N3_FEMME as RAW_N3_F,
  CHALLENGES_N4_HOMME as RAW_N4_H,
  CHALLENGES_N4_FEMME as RAW_N4_F,
  ChallengeData,
} from "./challenges";

// ============================================================
// TYPES
// ============================================================

/**
 * Template de défi étendu avec support jouets
 */
export interface ExtendedChallengeTemplate {
  /** Identifiant unique (format: n{level}_{h/f}_{numero}) */
  id: string;
  /** Texte du défi */
  text: string;
  /** Niveau d'intensité (1-4) */
  level: IntensityLevel;
  /** Genre cible */
  gender: Gender;
  /** Type de média requis */
  type: ChallengeType;
  /** Thème du défi */
  theme: string;
  /** Si le défi nécessite un jouet */
  hasToy: boolean;
  /** Nom du jouet si applicable */
  toyName: string | null;
}

// ============================================================
// MAPPING DES JOUETS (pour détection automatique)
// ============================================================

/**
 * Mots-clés pour détecter les jouets dans le texte des défis
 * Clé = toyName (ID du jouet), Valeur = mots-clés à chercher
 */
const TOY_KEYWORDS: Record<string, string[]> = {
  vibrator: ["vibromasseur", "vibro", "vibrant", "vibrateur", "œuf vibrant"],
  handcuffs: ["menottes", "menotte", "attaché", "attachée", "attachées", "attachés"],
  blindfold: ["bandeau", "yeux bandés", "les yeux bandés", "aveugle"],
  anal_plug: ["plug", "plug anal"],
  dildo: ["gode", "dildo", "gode-ceinture", "strap-on", "strap on", "gode ventouse"],
  cock_ring: ["cockring", "cock ring", "anneau vibrant", "anneau"],
  massage_oil: ["huile", "huile de massage", "lubrifiant", "lubrifié", "lubrifiée"],
  feathers: ["plume", "plumes"],
  nipple_clamps: [
    "pince",
    "pinces",
    "pince à tétons",
    "pinces à tétons",
    "pince à linge",
    "pinces à linge",
  ],
  collar: ["collier", "laisse"],
  masturbator: ["masturbateur"],
  prostate_stimulator: ["stimulateur prostatique", "prostatique"],
};

// ============================================================
// FONCTIONS DE CONVERSION
// ============================================================

/**
 * Détecte si un défi nécessite un jouet et lequel
 */
function detectToy(text: string): { hasToy: boolean; toyName: string | null } {
  const lowerText = text.toLowerCase();

  for (const [toyName, keywords] of Object.entries(TOY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return { hasToy: true, toyName };
      }
    }
  }

  return { hasToy: false, toyName: null };
}

/**
 * Convertit un tableau de défis bruts en défis étendus
 */
function convertChallenges(
  rawChallenges: ChallengeData[],
  level: IntensityLevel,
  gender: Gender
): ExtendedChallengeTemplate[] {
  const genderCode = gender === "homme" ? "h" : "f";

  return rawChallenges.map((raw, index) => {
    const { hasToy, toyName } = detectToy(raw.text);
    const id = `n${level}_${genderCode}_${String(index + 1).padStart(3, "0")}`;

    return {
      id,
      text: raw.text,
      level,
      gender,
      type: raw.type,
      theme: raw.theme,
      hasToy,
      toyName,
    };
  });
}

// ============================================================
// DÉFIS CONVERTIS
// ============================================================

export const CHALLENGES_N1_HOMME = convertChallenges(RAW_N1_H, 1, "homme");
export const CHALLENGES_N1_FEMME = convertChallenges(RAW_N1_F, 1, "femme");
export const CHALLENGES_N2_HOMME = convertChallenges(RAW_N2_H, 2, "homme");
export const CHALLENGES_N2_FEMME = convertChallenges(RAW_N2_F, 2, "femme");
export const CHALLENGES_N3_HOMME = convertChallenges(RAW_N3_H, 3, "homme");
export const CHALLENGES_N3_FEMME = convertChallenges(RAW_N3_F, 3, "femme");
export const CHALLENGES_N4_HOMME = convertChallenges(RAW_N4_H, 4, "homme");
export const CHALLENGES_N4_FEMME = convertChallenges(RAW_N4_F, 4, "femme");

// ============================================================
// MAP DES DÉFIS PAR NIVEAU ET GENRE
// ============================================================

export const CHALLENGES_MAP: Record<
  IntensityLevel,
  Record<Gender, ExtendedChallengeTemplate[]>
> = {
  1: {
    homme: CHALLENGES_N1_HOMME,
    femme: CHALLENGES_N1_FEMME,
  },
  2: {
    homme: CHALLENGES_N2_HOMME,
    femme: CHALLENGES_N2_FEMME,
  },
  3: {
    homme: CHALLENGES_N3_HOMME,
    femme: CHALLENGES_N3_FEMME,
  },
  4: {
    homme: CHALLENGES_N4_HOMME,
    femme: CHALLENGES_N4_FEMME,
  },
};

// ============================================================
// FONCTIONS D'ACCÈS AUX DONNÉES
// ============================================================

/**
 * Récupère tous les défis
 */
export function getAllChallenges(): ExtendedChallengeTemplate[] {
  const all: ExtendedChallengeTemplate[] = [];
  for (const level of [1, 2, 3, 4] as IntensityLevel[]) {
    for (const gender of ["homme", "femme"] as Gender[]) {
      all.push(...CHALLENGES_MAP[level][gender]);
    }
  }
  return all;
}

/**
 * Récupère les défis par niveau
 */
export function getChallengesByLevel(
  level: IntensityLevel
): ExtendedChallengeTemplate[] {
  return [...CHALLENGES_MAP[level].homme, ...CHALLENGES_MAP[level].femme];
}

/**
 * Récupère les défis par genre
 */
export function getChallengesByGender(
  gender: Gender
): ExtendedChallengeTemplate[] {
  const challenges: ExtendedChallengeTemplate[] = [];
  for (const level of [1, 2, 3, 4] as IntensityLevel[]) {
    challenges.push(...CHALLENGES_MAP[level][gender]);
  }
  return challenges;
}

/**
 * Récupère les défis par thème
 */
export function getChallengesByTheme(
  theme: string
): ExtendedChallengeTemplate[] {
  return getAllChallenges().filter((c) => c.theme === theme);
}

/**
 * Récupère les défis nécessitant un jouet spécifique
 */
export function getChallengesWithToy(
  toyName: string
): ExtendedChallengeTemplate[] {
  return getAllChallenges().filter((c) => c.hasToy && c.toyName === toyName);
}

/**
 * Récupère les défis sans jouet
 */
export function getChallengesWithoutToy(): ExtendedChallengeTemplate[] {
  return getAllChallenges().filter((c) => !c.hasToy);
}

/**
 * Récupère les statistiques des défis
 */
export function getChallengeStats(): {
  total: number;
  byLevel: Record<
    IntensityLevel,
    { homme: number; femme: number; total: number }
  >;
  withToys: number;
  byToy: Record<string, number>;
  byType: Record<ChallengeType, number>;
  byTheme: Record<string, number>;
} {
  const all = getAllChallenges();

  // Compter par jouet
  const byToy: Record<string, number> = {};
  all
    .filter((c) => c.hasToy && c.toyName)
    .forEach((c) => {
      byToy[c.toyName!] = (byToy[c.toyName!] || 0) + 1;
    });

  // Compter par thème
  const byTheme: Record<string, number> = {};
  all.forEach((c) => {
    byTheme[c.theme] = (byTheme[c.theme] || 0) + 1;
  });

  return {
    total: all.length,
    byLevel: {
      1: {
        homme: CHALLENGES_MAP[1].homme.length,
        femme: CHALLENGES_MAP[1].femme.length,
        total: CHALLENGES_MAP[1].homme.length + CHALLENGES_MAP[1].femme.length,
      },
      2: {
        homme: CHALLENGES_MAP[2].homme.length,
        femme: CHALLENGES_MAP[2].femme.length,
        total: CHALLENGES_MAP[2].homme.length + CHALLENGES_MAP[2].femme.length,
      },
      3: {
        homme: CHALLENGES_MAP[3].homme.length,
        femme: CHALLENGES_MAP[3].femme.length,
        total: CHALLENGES_MAP[3].homme.length + CHALLENGES_MAP[3].femme.length,
      },
      4: {
        homme: CHALLENGES_MAP[4].homme.length,
        femme: CHALLENGES_MAP[4].femme.length,
        total: CHALLENGES_MAP[4].homme.length + CHALLENGES_MAP[4].femme.length,
      },
    },
    withToys: all.filter((c) => c.hasToy).length,
    byToy,
    byType: {
      audio: all.filter((c) => c.type === "audio").length,
      video: all.filter((c) => c.type === "video").length,
      photo: all.filter((c) => c.type === "photo").length,
      texte: all.filter((c) => c.type === "texte").length,
    },
    byTheme,
  };
}

/**
 * Retourne le nombre total de défis disponibles par niveau
 */
export function getChallengeCountByLevel(level: IntensityLevel): number {
  return CHALLENGES_MAP[level].homme.length + CHALLENGES_MAP[level].femme.length;
}

/**
 * Retourne tous les thèmes uniques
 */
export function getAllThemes(): string[] {
  const themes = new Set<string>();
  getAllChallenges().forEach((c) => themes.add(c.theme));
  return Array.from(themes).sort();
}

/**
 * Retourne tous les jouets mentionnés dans les défis
 */
export function getAllToys(): string[] {
  const toys = new Set<string>();
  getAllChallenges()
    .filter((c) => c.hasToy && c.toyName)
    .forEach((c) => toys.add(c.toyName!));
  return Array.from(toys).sort();
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  CHALLENGES_MAP,
  CHALLENGES_N1_HOMME,
  CHALLENGES_N1_FEMME,
  CHALLENGES_N2_HOMME,
  CHALLENGES_N2_FEMME,
  CHALLENGES_N3_HOMME,
  CHALLENGES_N3_FEMME,
  CHALLENGES_N4_HOMME,
  CHALLENGES_N4_FEMME,
  getAllChallenges,
  getChallengesByLevel,
  getChallengesByGender,
  getChallengesByTheme,
  getChallengesWithToy,
  getChallengesWithoutToy,
  getChallengeStats,
  getChallengeCountByLevel,
  getAllThemes,
  getAllToys,
};