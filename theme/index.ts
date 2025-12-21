/**
 * Theme - Intimacy Play
 * 
 * Point d'entrée unique pour tous les tokens de design
 * 
 * Usage:
 * import { colors, typography, spacing } from '@/theme';
 * import theme from '@/theme';
 */

import colors, {
  getIntensityColor,
  getPrimaryColor,
  getGrayColor,
} from './colors';

import typography, {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  textStyles,
  twTextStyles,
} from './typography';

import spacingModule, {
  spacing,
  borderRadius,
  iconSize,
  buttonSize,
  inputSize,
  layout,
  twLayout,
  shadows,
} from './spacing';

// ============================================================
// EXPORTS INDIVIDUELS
// ============================================================

export {
  // Colors
  colors,
  getIntensityColor,
  getPrimaryColor,
  getGrayColor,
  
  // Typography
  typography,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  textStyles,
  twTextStyles,
  
  // Spacing
  spacing,
  borderRadius,
  iconSize,
  buttonSize,
  inputSize,
  layout,
  twLayout,
  shadows,
};

// ============================================================
// THEME COMPLET
// ============================================================

const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  iconSize,
  buttonSize,
  inputSize,
  layout,
  shadows,
  
  // Helpers
  getIntensityColor,
  getPrimaryColor,
  getGrayColor,
  
  // NativeWind classes
  tw: {
    text: twTextStyles,
    layout: twLayout,
  },
} as const;

export default theme;

// ============================================================
// TYPES
// ============================================================

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;