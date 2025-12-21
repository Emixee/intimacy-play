/**
 * Palette de couleurs - Intimacy Play
 * 
 * Thème rose romantique optimisé pour une app de couple
 * Basé sur les spécifications UI-DESIGN.md
 */

export const colors = {
  // ============================================================
  // COULEURS PRIMAIRES (Rose)
  // ============================================================
  primary: {
    50: '#FFF5F7',    // Background principal
    100: '#FFE4E9',   // Background secondaire
    200: '#FFCCD5',   // Borders légers
    300: '#FFB3C1',   // Hover states
    400: '#FF8FA3',   // Active states
    500: '#FF6B85',   // Boutons secondaires
    600: '#E91E63',   // Couleur principale (boutons, liens)
    700: '#C2185B',   // Hover sur primary
    800: '#AD1457',   // Active sur primary
    900: '#880E4F',   // Texte accentué
  },

  // ============================================================
  // COULEURS NEUTRES (Gris)
  // ============================================================
  gray: {
    50: '#FAFAFA',    // Background très clair
    100: '#F5F5F5',   // Background clair
    200: '#EEEEEE',   // Borders
    300: '#E0E0E0',   // Borders foncés
    400: '#BDBDBD',   // Placeholder text
    500: '#9E9E9E',   // Texte désactivé
    600: '#757575',   // Texte secondaire
    700: '#616161',   // Texte normal
    800: '#424242',   // Texte foncé
    900: '#212121',   // Texte principal
  },

  // ============================================================
  // COULEURS D'INTENSITÉ (Niveaux de défis)
  // ============================================================
  intensity: {
    1: '#4CAF50',     // Vert - Romantique (😇)
    2: '#FF9800',     // Orange - Sensuel (😊)
    3: '#E91E63',     // Rose - Érotique (😏)
    4: '#F44336',     // Rouge - Explicite (🔥)
  },

  // ============================================================
  // COULEURS SÉMANTIQUES
  // ============================================================
  success: '#4CAF50',   // Vert - Succès, validation
  warning: '#FF9800',   // Orange - Attention
  error: '#F44336',     // Rouge - Erreur
  info: '#2196F3',      // Bleu - Information

  // ============================================================
  // COULEURS PREMIUM
  // ============================================================
  premium: {
    gold: '#FFD700',
    goldDark: '#FFA500',
    gradient: ['#FFD700', '#FFA500'] as const,
  },

  // ============================================================
  // COULEURS DE BASE
  // ============================================================
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // ============================================================
  // COULEURS SPÉCIFIQUES APP
  // ============================================================
  background: '#FFF5F7',      // primary.50
  surface: '#FFFFFF',         // Cartes, modals
  text: '#212121',            // gray.900
  textSecondary: '#757575',   // gray.600
  border: '#E0E0E0',          // gray.300
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// ============================================================
// TYPES
// ============================================================

export type ColorKey = keyof typeof colors;
export type PrimaryShade = keyof typeof colors.primary;
export type GrayShade = keyof typeof colors.gray;
export type IntensityLevel = keyof typeof colors.intensity;

// ============================================================
// HELPERS
// ============================================================

/**
 * Récupère la couleur d'intensité pour un niveau donné
 */
export const getIntensityColor = (level: 1 | 2 | 3 | 4): string => {
  return colors.intensity[level];
};

/**
 * Récupère la couleur primaire avec une shade
 */
export const getPrimaryColor = (shade: PrimaryShade = 600): string => {
  return colors.primary[shade];
};

/**
 * Récupère la couleur grise avec une shade
 */
export const getGrayColor = (shade: GrayShade = 500): string => {
  return colors.gray[shade];
};

export default colors;