/**
 * Données des défis pour Intimacy Play - Version étendue
 * 
 * Structure étendue avec :
 * - id: Identifiant unique (format: n{level}_{gender[0]}_{numero})
 * - text: Texte du défi
 * - level: Niveau d'intensité (1-4)
 * - gender: Genre cible ('homme' | 'femme')
 * - type: Type de média ('audio' | 'video' | 'photo' | 'texte')
 * - theme: Thème du défi (correspond aux IDs de utils/constants.ts)
 * - hasToy: Si le défi nécessite un jouet
 * - toyName: Nom du jouet si hasToy=true (correspond aux IDs de TOYS)
 * 
 * Total : 648 défis
 * - Niveau 1 : 86 (43 homme + 43 femme) - Romantique (Gratuit)
 * - Niveau 2 : 70 (35 homme + 35 femme) - Sensuel (Gratuit)
 * - Niveau 3 : 163 (81 homme + 82 femme) - Érotique (Premium)
 * - Niveau 4 : 329 (161 homme + 168 femme) - Explicite (Premium)
 */

import type { IntensityLevel, Gender, ChallengeType } from "../types";

// ============================================================
// TYPES
// ============================================================

/**
 * Template de défi étendu avec support jouets
 */
export interface ExtendedChallengeTemplate {
  /** Identifiant unique (format: n{level}_{gender[0]}_{numero}) */
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
// DÉFIS NIVEAU 1 - ROMANTIQUE (Gratuit)
// 10 exemples par genre pour test
// ============================================================

export const CHALLENGES_N1_HOMME: ExtendedChallengeTemplate[] = [
  {
    id: "n1_h_001",
    text: "Enregistre-toi en train de lui dire 3 choses que tu aimes chez elle",
    level: 1,
    gender: "homme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_002",
    text: "Chante-lui une chanson qui te fait penser à elle",
    level: 1,
    gender: "homme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_003",
    text: "Raconte-lui ton plus beau souvenir ensemble",
    level: 1,
    gender: "homme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_004",
    text: "Dis-lui ce que tu ressens quand tu penses à elle",
    level: 1,
    gender: "homme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_005",
    text: "Enregistre un message de bonne nuit personnalisé",
    level: 1,
    gender: "homme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_006",
    text: "Envoie une selfie de toi avec un grand sourire pour elle",
    level: 1,
    gender: "homme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_007",
    text: "Photographie un endroit qui te fait penser à elle",
    level: 1,
    gender: "homme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_008",
    text: "Envoie une photo du ciel et dédie-la lui",
    level: 1,
    gender: "homme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_009",
    text: "Filme-toi en train de lui envoyer un bisou",
    level: 1,
    gender: "homme",
    type: "video",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_h_010",
    text: "Enregistre une vidéo de toi en lui disant bonjour",
    level: 1,
    gender: "homme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
];

export const CHALLENGES_N1_FEMME: ExtendedChallengeTemplate[] = [
  {
    id: "n1_f_001",
    text: "Enregistre-toi en train de lui dire 3 choses que tu aimes chez lui",
    level: 1,
    gender: "femme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_002",
    text: "Chante-lui une chanson qui te fait penser à lui",
    level: 1,
    gender: "femme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_003",
    text: "Raconte-lui ton plus beau souvenir ensemble",
    level: 1,
    gender: "femme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_004",
    text: "Dis-lui ce que tu ressens quand tu penses à lui",
    level: 1,
    gender: "femme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_005",
    text: "Enregistre un message de bonne nuit personnalisé",
    level: 1,
    gender: "femme",
    type: "audio",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_006",
    text: "Envoie une selfie de toi avec un grand sourire pour lui",
    level: 1,
    gender: "femme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_007",
    text: "Photographie un endroit qui te fait penser à lui",
    level: 1,
    gender: "femme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_008",
    text: "Prends une photo du ciel et dédie-la lui",
    level: 1,
    gender: "femme",
    type: "photo",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_009",
    text: "Filme-toi en train de lui envoyer un bisou",
    level: 1,
    gender: "femme",
    type: "video",
    theme: "romantic",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n1_f_010",
    text: "Enregistre une vidéo de toi en lui disant bonjour",
    level: 1,
    gender: "femme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
];

// ============================================================
// DÉFIS NIVEAU 2 - SENSUEL (Gratuit)
// 10 exemples par genre pour test
// ============================================================

export const CHALLENGES_N2_HOMME: ExtendedChallengeTemplate[] = [
  {
    id: "n2_h_001",
    text: "Décris-lui ce que tu ferais si tu pouvais l'embrasser maintenant",
    level: 2,
    gender: "homme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_002",
    text: "Murmure-lui des mots doux comme si elle était près de toi",
    level: 2,
    gender: "homme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_003",
    text: "Raconte-lui ton fantasme le plus romantique avec elle",
    level: 2,
    gender: "homme",
    type: "audio",
    theme: "fantasies",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_004",
    text: "Dis-lui ce qui te fait craquer chez elle physiquement",
    level: 2,
    gender: "homme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_005",
    text: "Enregistre un message avec ta voix la plus sensuelle",
    level: 2,
    gender: "homme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_006",
    text: "Envoie une selfie miroir de toi torse nu avec un sourire séducteur",
    level: 2,
    gender: "homme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_007",
    text: "Prends une selfie miroir suggestive en boxer",
    level: 2,
    gender: "homme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_008",
    text: "Envoie une selfie de toi te mordant la lèvre",
    level: 2,
    gender: "homme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_009",
    text: "Filme-toi en train d'enlever ta chemise lentement",
    level: 2,
    gender: "homme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_h_010",
    text: "Enregistre une vidéo de toi dansant sensuellement",
    level: 2,
    gender: "homme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
];

export const CHALLENGES_N2_FEMME: ExtendedChallengeTemplate[] = [
  {
    id: "n2_f_001",
    text: "Décris-lui ce que tu ferais si tu pouvais l'embrasser maintenant",
    level: 2,
    gender: "femme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_002",
    text: "Murmure-lui des mots doux comme s'il était près de toi",
    level: 2,
    gender: "femme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_003",
    text: "Raconte-lui ton fantasme le plus romantique avec lui",
    level: 2,
    gender: "femme",
    type: "audio",
    theme: "fantasies",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_004",
    text: "Dis-lui ce qui te fait craquer chez lui physiquement",
    level: 2,
    gender: "femme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_005",
    text: "Enregistre un message avec ta voix la plus sensuelle",
    level: 2,
    gender: "femme",
    type: "audio",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_006",
    text: "Envoie une selfie miroir de toi en lingerie fine",
    level: 2,
    gender: "femme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_007",
    text: "Prends une selfie miroir suggestive en nuisette",
    level: 2,
    gender: "femme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_008",
    text: "Envoie une selfie de toi te mordant la lèvre",
    level: 2,
    gender: "femme",
    type: "photo",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_009",
    text: "Filme-toi en train d'enlever ton haut lentement",
    level: 2,
    gender: "femme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n2_f_010",
    text: "Enregistre une vidéo de toi dansant sensuellement",
    level: 2,
    gender: "femme",
    type: "video",
    theme: "sensual",
    hasToy: false,
    toyName: null,
  },
];

// ============================================================
// DÉFIS NIVEAU 3 - ÉROTIQUE (Premium)
// 10 exemples par genre pour test (incluant défis avec jouets)
// ============================================================

export const CHALLENGES_N3_HOMME: ExtendedChallengeTemplate[] = [
  {
    id: "n3_h_001",
    text: "Décris-lui en détail comment tu aimerais explorer son corps",
    level: 3,
    gender: "homme",
    type: "audio",
    theme: "foreplay",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_002",
    text: "Enregistre-toi en train de gémir doucement en pensant à elle",
    level: 3,
    gender: "homme",
    type: "audio",
    theme: "dirty_talk",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_003",
    text: "Raconte-lui un fantasme érotique détaillé",
    level: 3,
    gender: "homme",
    type: "audio",
    theme: "fantasies",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_004",
    text: "Envoie une photo de ton érection à travers ton boxer",
    level: 3,
    gender: "homme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_005",
    text: "Prends une selfie miroir de toi nu",
    level: 3,
    gender: "homme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_006",
    text: "Filme-toi en train de te déshabiller complètement",
    level: 3,
    gender: "homme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_007",
    text: "Enregistre-toi en donnant des ordres d'une voix autoritaire",
    level: 3,
    gender: "homme",
    type: "audio",
    theme: "domination",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_h_008",
    text: "Mets le bandeau et envoie une photo de toi les yeux bandés",
    level: 3,
    gender: "homme",
    type: "photo",
    theme: "bdsm_light",
    hasToy: true,
    toyName: "blindfold",
  },
  {
    id: "n3_h_009",
    text: "Attache-toi les poignets avec les menottes et prends une selfie",
    level: 3,
    gender: "homme",
    type: "photo",
    theme: "submission",
    hasToy: true,
    toyName: "handcuffs",
  },
  {
    id: "n3_h_010",
    text: "Utilise l'huile de massage et filme-toi te massant le torse",
    level: 3,
    gender: "homme",
    type: "video",
    theme: "massage",
    hasToy: true,
    toyName: "massage_oil",
  },
];

export const CHALLENGES_N3_FEMME: ExtendedChallengeTemplate[] = [
  {
    id: "n3_f_001",
    text: "Décris-lui en détail comment tu aimerais qu'il explore ton corps",
    level: 3,
    gender: "femme",
    type: "audio",
    theme: "foreplay",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_002",
    text: "Enregistre-toi en train de gémir doucement en pensant à lui",
    level: 3,
    gender: "femme",
    type: "audio",
    theme: "dirty_talk",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_003",
    text: "Raconte-lui un fantasme érotique détaillé",
    level: 3,
    gender: "femme",
    type: "audio",
    theme: "fantasies",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_004",
    text: "Envoie une photo de ton intimité à travers ta culotte",
    level: 3,
    gender: "femme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_005",
    text: "Prends une selfie miroir de toi nue",
    level: 3,
    gender: "femme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_006",
    text: "Filme-toi en train de te déshabiller complètement",
    level: 3,
    gender: "femme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_007",
    text: "Enregistre-toi en donnant des ordres d'une voix autoritaire",
    level: 3,
    gender: "femme",
    type: "audio",
    theme: "domination",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n3_f_008",
    text: "Mets le bandeau et envoie une photo de toi les yeux bandés",
    level: 3,
    gender: "femme",
    type: "photo",
    theme: "bdsm_light",
    hasToy: true,
    toyName: "blindfold",
  },
  {
    id: "n3_f_009",
    text: "Mets les menottes et prends une selfie les mains attachées",
    level: 3,
    gender: "femme",
    type: "photo",
    theme: "submission",
    hasToy: true,
    toyName: "handcuffs",
  },
  {
    id: "n3_f_010",
    text: "Utilise l'huile de massage et filme-toi te massant la poitrine",
    level: 3,
    gender: "femme",
    type: "video",
    theme: "massage",
    hasToy: true,
    toyName: "massage_oil",
  },
];

// ============================================================
// DÉFIS NIVEAU 4 - EXPLICITE (Premium)
// 10 exemples par genre pour test (incluant défis avec jouets)
// ============================================================

export const CHALLENGES_N4_HOMME: ExtendedChallengeTemplate[] = [
  {
    id: "n4_h_001",
    text: "Enregistre-toi en train de te masturber en gémissant son prénom",
    level: 4,
    gender: "homme",
    type: "audio",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_002",
    text: "Décris-lui exactement ce que tu fais pendant que tu te touches",
    level: 4,
    gender: "homme",
    type: "audio",
    theme: "dirty_talk",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_003",
    text: "Enregistre tes gémissements pendant que tu jouis",
    level: 4,
    gender: "homme",
    type: "audio",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_004",
    text: "Envoie une photo de ta main tenant ton sexe en érection",
    level: 4,
    gender: "homme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_005",
    text: "Prends une photo de ton sexe dressé, gros plan",
    level: 4,
    gender: "homme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_006",
    text: "Filme ta main montant et descendant sur ton sexe",
    level: 4,
    gender: "homme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_007",
    text: "Filme-toi en train de jouir en disant son prénom",
    level: 4,
    gender: "homme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_h_008",
    text: "Utilise le vibromasseur sur tes testicules et filme ta réaction",
    level: 4,
    gender: "homme",
    type: "video",
    theme: "torrid",
    hasToy: true,
    toyName: "vibrator",
  },
  {
    id: "n4_h_009",
    text: "Insère le plug anal et envoie une photo de toi le portant",
    level: 4,
    gender: "homme",
    type: "photo",
    theme: "bdsm_light",
    hasToy: true,
    toyName: "anal_plug",
  },
  {
    id: "n4_h_010",
    text: "Mets le cockring et prends une photo de ton érection avec",
    level: 4,
    gender: "homme",
    type: "photo",
    theme: "torrid",
    hasToy: true,
    toyName: "cock_ring",
  },
];

export const CHALLENGES_N4_FEMME: ExtendedChallengeTemplate[] = [
  {
    id: "n4_f_001",
    text: "Enregistre-toi en train de te masturber en gémissant son prénom",
    level: 4,
    gender: "femme",
    type: "audio",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_002",
    text: "Décris-lui exactement ce que tu fais pendant que tu te touches",
    level: 4,
    gender: "femme",
    type: "audio",
    theme: "dirty_talk",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_003",
    text: "Enregistre tes gémissements pendant que tu jouis",
    level: 4,
    gender: "femme",
    type: "audio",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_004",
    text: "Envoie une photo de ta main sur ton sexe ouvert",
    level: 4,
    gender: "femme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_005",
    text: "Prends une photo de ton intimité, gros plan",
    level: 4,
    gender: "femme",
    type: "photo",
    theme: "exhibitionism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_006",
    text: "Filme tes doigts entrant et sortant de ton sexe",
    level: 4,
    gender: "femme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_007",
    text: "Filme-toi en train de jouir en disant son prénom",
    level: 4,
    gender: "femme",
    type: "video",
    theme: "voyeurism",
    hasToy: false,
    toyName: null,
  },
  {
    id: "n4_f_008",
    text: "Utilise le vibromasseur sur ton clitoris et filme ta réaction",
    level: 4,
    gender: "femme",
    type: "video",
    theme: "torrid",
    hasToy: true,
    toyName: "vibrator",
  },
  {
    id: "n4_f_009",
    text: "Insère le plug anal et envoie une photo de toi le portant",
    level: 4,
    gender: "femme",
    type: "photo",
    theme: "bdsm_light",
    hasToy: true,
    toyName: "anal_plug",
  },
  {
    id: "n4_f_010",
    text: "Utilise le gode et filme-toi en plein plaisir",
    level: 4,
    gender: "femme",
    type: "video",
    theme: "torrid",
    hasToy: true,
    toyName: "dildo",
  },
];

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
  return [
    ...CHALLENGES_MAP[level].homme,
    ...CHALLENGES_MAP[level].femme,
  ];
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
  return getAllChallenges().filter(
    (c) => c.hasToy && c.toyName === toyName
  );
}

/**
 * Récupère les statistiques des défis
 */
export function getChallengeStats(): {
  total: number;
  byLevel: Record<IntensityLevel, { homme: number; femme: number; total: number }>;
  withToys: number;
  byType: Record<ChallengeType, number>;
} {
  const all = getAllChallenges();
  
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
    byType: {
      audio: all.filter((c) => c.type === "audio").length,
      video: all.filter((c) => c.type === "video").length,
      photo: all.filter((c) => c.type === "photo").length,
      texte: all.filter((c) => c.type === "texte").length,
    },
  };
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  CHALLENGES_MAP,
  getAllChallenges,
  getChallengesByLevel,
  getChallengesByGender,
  getChallengesByTheme,
  getChallengesWithToy,
  getChallengeStats,
};