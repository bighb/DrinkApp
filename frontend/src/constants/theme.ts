import { DefaultTheme } from 'react-native-paper';
import { AppTheme } from '@/types';

export const colors = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  secondary: '#03DAC6',
  accent: '#FF5722',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#F44336',
  errorContainer: '#FFEBEE',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  
  // Water theme colors
  waterBlue: '#00BCD4',
  waterLight: '#E0F7FA',
  waterDark: '#00838F',
  
  // Gradient colors
  gradientStart: '#2196F3',
  gradientEnd: '#21CBF3',
  
  // Glass effect
  glassBackground: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  
  // Dark theme
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const theme: AppTheme = {
  colors,
  spacing,
  typography,
  borderRadius,
};

// React Native Paper theme
export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    disabled: colors.textSecondary,
    placeholder: colors.textSecondary,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: colors.text,
    notification: colors.accent,
  },
  roundness: borderRadius.md,
};

// Dark theme
export const darkTheme: AppTheme = {
  ...theme,
  colors: {
    ...colors,
    background: colors.dark.background,
    surface: colors.dark.surface,
    text: colors.dark.text,
    textSecondary: colors.dark.textSecondary,
    border: colors.dark.border,
  },
};

export const darkPaperTheme = {
  ...paperTheme,
  colors: {
    ...paperTheme.colors,
    primary: colors.primary,
    background: colors.dark.background,
    surface: colors.dark.surface,
    text: colors.dark.text,
    onSurface: colors.dark.text,
    disabled: colors.dark.textSecondary,
    placeholder: colors.dark.textSecondary,
  },
};