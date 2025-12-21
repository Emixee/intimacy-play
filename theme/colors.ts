/**
 * Palette de couleurs - Intimacy Play
 * 
 * Thème rose romantique optimisé pour une app de couple
 * Palette complète avec variantes et couleurs par intensité
 */

// ============================================================
// COULEURS PRIMAIRES (Rose)
// ============================================================

export const pink = {
  50: "#FFF5F7",   // Background principal très clair
  100: "#FFE4E9",  // Background secondaire
  200: "#FFCCD5",  // Borders légers, états disabled
  300: "#FFB3C1",  // Hover states légers
  400: "#FF8FA3",  // Active states
  500: "#FF6B85",  // Boutons secondaires, accents
  600: "#E91E63",  // Couleur principale (boutons primaires)
  700: "#C2185B",  // Hover sur boutons primaires
  800: "#AD1457",  // Active/pressed sur primaires
  900: "#880E4F",  // Texte accentué, titres importants
} as const;

// ============================================================
// COULEURS NEUTRES (Gris)
// ============================================================

export const gray = {
  50: "#FAFAFA",   // Background très clair
  100: "#F5F5F5",  // Background clair, cartes
  200: "#EEEEEE",  // Borders légers
  300: "#E0E0E0",  // Borders, dividers
  400: "#BDBDBD",  // Placeholder text, icônes disabled
  500: "#9E9E9E",  // Texte désactivé, hints
  600: "#757575",  // Texte secondaire
  700: "#616161",  // Texte normal, body
  800: "#424242",  // Texte foncé, sous-titres
  900: "#212121",  // Texte principal, titres
} as const;

// ============================================================
// COULEURS D'INTENSITÉ (Niveaux de défis)
// ============================================================

export const intensity = {
  /** Niveau 1 - Romantique (Vert doux) */
  1: {
    main: "#4CAF50",
    light: "#81C784",
    dark: "#388E3C",
    gradient: ["#4CAF50", "#81C784"] as const,
    background: "#E8F5E9",
  },
  /** Niveau 2 - Sensuel (Orange chaleureux) */
  2: {
    main: "#FF9800",
    light: "#FFB74D",
    dark: "#F57C00",
    gradient: ["#FF9800", "#FFB74D"] as const,
    background: "#FFF3E0",
  },
  /** Niveau 3 - Érotique (Rose intense) */
  3: {
    main: "#E91E63",
    light: "#F48FB1",
    dark: "#C2185B",
    gradient: ["#E91E63", "#F48FB1"] as const,
    background: "#FCE4EC",
  },
  /** Niveau 4 - Explicite (Rouge passion) */
  4: {
    main: "#F44336",
    light: "#E57373",
    dark: "#D32F2F",
    gradient: ["#F44336", "#FF5252"] as const,
    background: "#FFEBEE",
  },
} as const;

// ============================================================
// COULEURS SÉMANTIQUES
// ============================================================

export const semantic = {
  success: {
    main: "#4CAF50",
    light: "#81C784",
    dark: "#388E3C",
    background: "#E8F5E9",
  },
  warning: {
    main: "#FF9800",
    light: "#FFB74D",
    dark: "#F57C00",
    background: "#FFF3E0",
  },
  error: {
    main: "#F44336",
    light: "#E57373",
    dark: "#D32F2F",
    background: "#FFEBEE",
  },
  info: {
    main: "#2196F3",
    light: "#64B5F6",
    dark: "#1976D2",
    background: "#E3F2FD",
  },
} as const;

// ============================================================
// COULEURS PREMIUM
// ============================================================

export const premium = {
  gold: "#FFD700",
  goldLight: "#FFEB3B",
  goldDark: "#FFA500",
  gradient: ["#FFD700", "#FFA500"] as const,
  background: "#FFFDE7",
  border: "#FFE082",
} as const;

// ============================================================
// COULEURS DE BASE
// ============================================================

export const base = {
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

// ============================================================
// OVERLAYS & SHADOWS
// ============================================================

export const overlays = {
  light: "rgba(255, 255, 255, 0.9)",
  medium: "rgba(0, 0, 0, 0.5)",
  dark: "rgba(0, 0, 0, 0.7)",
  pink: "rgba(233, 30, 99, 0.1)",
  pinkMedium: "rgba(233, 30, 99, 0.2)",
} as const;

export const shadows = {
  light: "rgba(0, 0, 0, 0.1)",
  medium: "rgba(0, 0, 0, 0.2)",
  dark: "rgba(0, 0, 0, 0.3)",
  pink: "rgba(233, 30, 99, 0.3)",
} as const;

// ============================================================
// PALETTE COMPLÈTE EXPORTÉE
// ============================================================

export const colors = {
  // Palette primaire (rose)
  primary: {
    ...pink,
    main: pink[600],
    light: pink[100],
    dark: pink[800],
  },
  
  // Palette de gris
  gray,
  
  // Intensités
  intensity,
  
  // Sémantique
  ...semantic,
  
  // Premium
  premium,
  
  // Base
  ...base,
  
  // Overlays
  overlays,
  shadows,
  
  // ============================================================
  // RACCOURCIS PRATIQUES
  // ============================================================
  
  // Background
  background: pink[50],
  backgroundSecondary: gray[100],
  surface: base.white,
  surfaceElevated: base.white,
  
  // Texte
  text: gray[900],
  textSecondary: gray[600],
  textTertiary: gray[500],
  textDisabled: gray[400],
  textOnPrimary: base.white,
  textOnDark: base.white,
  
  // Bordures
  border: gray[300],
  borderLight: gray[200],
  borderFocused: pink[600],
  
  // Actions
  primary600: pink[600],
  primaryHover: pink[700],
  primaryPressed: pink[800],
  primaryDisabled: pink[200],
  
  // États
  success: semantic.success.main,
  warning: semantic.warning.main,
  error: semantic.error.main,
  info: semantic.info.main,
  
  // Spécifiques app
  heart: "#FF6B6B",
  fire: "#FF6B35",
  love: pink[600],
} as const;

// ============================================================
// TYPES
// ============================================================

export type PinkShade = keyof typeof pink;
export type GrayShade = keyof typeof gray;
export type IntensityLevel = keyof typeof intensity;
export type SemanticColor = keyof typeof semantic;

// ============================================================
// HELPERS
// ============================================================

/**
 * Récupère la couleur principale d'un niveau d'intensité
 */
export const getIntensityColor = (level: 1 | 2 | 3 | 4): string => {
  return intensity[level].main;
};

/**
 * Récupère le gradient d'un niveau d'intensité
 */
export const getIntensityGradient = (level: 1 | 2 | 3 | 4): readonly [string, string] => {
  return intensity[level].gradient;
};

/**
 * Récupère le background d'un niveau d'intensité
 */
export const getIntensityBackground = (level: 1 | 2 | 3 | 4): string => {
  return intensity[level].background;
};

/**
 * Récupère une shade de la palette primaire (rose)
 */
export const getPrimaryShade = (shade: PinkShade = 600): string => {
  return pink[shade];
};

/**
 * Récupère une shade de gris
 */
export const getGrayShade = (shade: GrayShade = 500): string => {
  return gray[shade];
};

/**
 * Vérifie si une couleur de texte doit être claire ou foncée
 * basé sur la luminosité du background
 */
export const getContrastText = (bgColor: string): string => {
  // Couleurs qui nécessitent un texte blanc
  const darkBgs = [
    pink[600], pink[700], pink[800], pink[900],
    gray[700], gray[800], gray[900],
    intensity[1].main, intensity[1].dark,
    intensity[2].main, intensity[2].dark,
    intensity[3].main, intensity[3].dark,
    intensity[4].main, intensity[4].dark,
    semantic.success.main, semantic.error.main,
    semantic.warning.main, semantic.info.main,
  ];
  
  return darkBgs.includes(bgColor) ? base.white : gray[900];
};

// ============================================================
// TAILWIND-LIKE SHORTCUTS
// ============================================================

/**
 * Mapping pour utilisation avec NativeWind/Tailwind
 * ex: className={`bg-${tw.pink500}`}
 */
export const tw = {
  // Pink
  pink50: "[#FFF5F7]",
  pink100: "[#FFE4E9]",
  pink200: "[#FFCCD5]",
  pink300: "[#FFB3C1]",
  pink400: "[#FF8FA3]",
  pink500: "[#FF6B85]",
  pink600: "[#E91E63]",
  pink700: "[#C2185B]",
  pink800: "[#AD1457]",
  pink900: "[#880E4F]",
  
  // Gray
  gray50: "[#FAFAFA]",
  gray100: "[#F5F5F5]",
  gray200: "[#EEEEEE]",
  gray300: "[#E0E0E0]",
  gray400: "[#BDBDBD]",
  gray500: "[#9E9E9E]",
  gray600: "[#757575]",
  gray700: "[#616161]",
  gray800: "[#424242]",
  gray900: "[#212121]",
  
  // Semantic
  success: "[#4CAF50]",
  warning: "[#FF9800]",
  error: "[#F44336]",
  info: "[#2196F3]",
  
  // Premium
  gold: "[#FFD700]",
} as const;

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default colors;
