import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary brand: refreshing, calm health emerald
    primary: '#10B981',
    primaryDark: '#047857',
    primaryLight: '#D1FAE5',
    primaryMuted: '#ECFDF5',

    // Backgrounds & Surfaces
    background: '#F8FAFC', // soft cool off-white
    surface: '#FFFFFF', // pure white card
    surfaceSecondary: '#F1F5F9', // light gray container
    surfaceElevated: '#FFFFFF',

    // Text & Content
    textPrimary: '#0F172A', // slate 900
    textSecondary: '#475569', // slate 600
    textMuted: '#94A3B8', // slate 400
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: '#E2E8F0', // slate 200
    borderLight: '#F1F5F9',

    // Nutritional Macro accents
    calories: '#10B981', // emerald
    caloriesBg: '#ECFDF5',
    protein: '#F43F5E', // rose coral
    proteinBg: '#FFF1F2',
    carbs: '#F59E0B', // amber
    carbsBg: '#FEF3C7',
    fat: '#3B82F6', // sky blue
    fatBg: '#EFF6FF',

    // Status & Utility
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    info: '#3B82F6',

    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#10B981',
    tabBarInactive: '#94A3B8',
    tabBarBorder: '#E2E8F0',
  },
  dark: {
    primary: '#10B981',
    primaryDark: '#047857',
    primaryLight: '#064E3B',
    primaryMuted: '#064E3B',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    surfaceElevated: '#1E293B',

    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#0F172A',

    border: '#334155',
    borderLight: '#1E293B',

    calories: '#34D399',
    caloriesBg: '#064E3B',
    protein: '#FB7185',
    proteinBg: '#4C0519',
    carbs: '#FBBF24',
    carbsBg: '#451A03',
    fat: '#60A5FA',
    fatBg: '#172554',

    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    dangerLight: '#450A0A',
    info: '#60A5FA',

    tabBarBackground: '#1E293B',
    tabBarActive: '#34D399',
    tabBarInactive: '#64748B',
    tabBarBorder: '#334155',
  },
} as const;

export type ThemeColors = typeof Colors.light;

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
    hero: 40,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    },
  }),
  cardHover: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    },
  }),
};
