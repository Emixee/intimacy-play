/**
 * Typographie - Intimacy Play
 * 
 * Système typographique cohérent pour l'application
 * Compatible avec NativeWind / Tailwind CSS
 */

import { Platform } from 'react-native';

// ============================================================
// FONT FAMILIES
// ============================================================

export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

// ============================================================
// FONT SIZES
// ============================================================

export const fontSize = {
  xs: 12,      // Texte très petit (labels, badges)
  sm: 14,      // Texte petit (descriptions secondaires)
  base: 16,    // Texte normal (paragraphes)
  lg: 18,      // Texte large (sous-titres)
  xl: 20,      // Titres de section
  '2xl': 24,   // Titres de page
  '3xl': 30,   // Grands titres
  '4xl': 36,   // Titres d'écran
  '5xl': 48,   // Titres hero
} as const;

// ============================================================
// LINE HEIGHTS
// ============================================================

export const lineHeight = {
  tight: 1.25,    // Titres compacts
  normal: 1.5,    // Texte normal
  relaxed: 1.75,  // Texte aéré
  loose: 2,       // Texte très espacé
} as const;

// ============================================================
// FONT WEIGHTS
// ============================================================

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ============================================================
// TEXT STYLES PRÉDÉFINIS
// ============================================================

export const textStyles = {
  // Titres
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  h5: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },

  // Corps de texte
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
  },

  // Labels et captions
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },

  // Boutons
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  buttonLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
} as const;

// ============================================================
// CLASSES NATIVEWIND CORRESPONDANTES
// ============================================================

export const twTextStyles = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  body: 'text-base',
  bodySmall: 'text-sm',
  bodyLarge: 'text-lg',
  label: 'text-sm font-medium',
  caption: 'text-xs',
  button: 'text-base font-semibold',
  buttonSmall: 'text-sm font-semibold',
  buttonLarge: 'text-lg font-semibold',
} as const;

export default {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  textStyles,
  twTextStyles,
};