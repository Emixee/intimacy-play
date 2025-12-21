/**
 * Espacements - Intimacy Play
 * 
 * Système d'espacement cohérent basé sur une échelle de 4px
 * Compatible avec NativeWind / Tailwind CSS
 */

// ============================================================
// ÉCHELLE D'ESPACEMENT (base 4px)
// ============================================================

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
} as const;

// ============================================================
// RAYONS DE BORDURE
// ============================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ============================================================
// TAILLES D'ICÔNES
// ============================================================

export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  DEFAULT: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

// ============================================================
// TAILLES DE BOUTONS
// ============================================================

export const buttonSize = {
  sm: {
    height: 36,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    iconSize: iconSize.sm,
  },
  md: {
    height: 44,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    iconSize: iconSize.md,
  },
  lg: {
    height: 52,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    iconSize: iconSize.DEFAULT,
  },
} as const;

// ============================================================
// TAILLES D'INPUTS
// ============================================================

export const inputSize = {
  sm: {
    height: 40,
    paddingHorizontal: spacing[3],
  },
  md: {
    height: 48,
    paddingHorizontal: spacing[4],
  },
  lg: {
    height: 56,
    paddingHorizontal: spacing[5],
  },
} as const;

// ============================================================
// LAYOUT CONSTANTS
// ============================================================

export const layout = {
  /** Padding horizontal des écrans */
  screenPaddingHorizontal: spacing[4],
  
  /** Padding vertical des écrans */
  screenPaddingVertical: spacing[6],
  
  /** Espacement entre les cartes */
  cardGap: spacing[4],
  
  /** Padding interne des cartes */
  cardPadding: spacing[4],
  
  /** Espacement des éléments de formulaire */
  formGap: spacing[4],
  
  /** Header height */
  headerHeight: 56,
  
  /** Tab bar height */
  tabBarHeight: 60,
  
  /** Bottom safe area padding */
  bottomSafeArea: spacing[8],
} as const;

// ============================================================
// CLASSES NATIVEWIND POUR LE LAYOUT
// ============================================================

export const twLayout = {
  screen: 'flex-1 bg-primary-50 px-4 py-6',
  screenCentered: 'flex-1 bg-primary-50 px-4 py-6 items-center justify-center',
  card: 'bg-white rounded-2xl p-4 shadow-sm',
  cardElevated: 'bg-white rounded-2xl p-4 shadow-md',
  row: 'flex-row items-center',
  rowBetween: 'flex-row items-center justify-between',
  center: 'items-center justify-center',
} as const;

// ============================================================
// SHADOWS
// ============================================================

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export default {
  spacing,
  borderRadius,
  iconSize,
  buttonSize,
  inputSize,
  layout,
  twLayout,
  shadows,
};