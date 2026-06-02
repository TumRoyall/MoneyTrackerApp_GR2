import { StyleSheet, TextStyle } from 'react-native';

export const colors = {
  // Primary Brand
  primary: '#29bcc8',
  primaryDark: '#1E8A8F',
  primaryLight: '#e9fbfd',

  // Secondary
  secondary: '#1E6B7C',
  secondaryDark: '#152F3D',
  secondaryLight: '#EDF4F7',

  // Accent
  accent: '#33c3cd',
  success: '#34A853',
  error: '#F36E79',
  warning: '#F5A623',

  // Neutrals
  background: '#F5F7F9',
  surface: '#FFFFFF',
  bgPrimary: '#F5F7F9',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F0F2F4',
  // Aliases
  backgroundPrimary: '#F5F7F9',
  backgroundSecondary: '#FFFFFF',

  // Text
  text: '#1F1F1F',
  textPrimary: '#1F1F1F',
  textSecondary: '#6C737A',
  textTertiary: '#8B8B8B',
  textInverse: '#FFFFFF',
  textDisabled: '#ADB5BD',

  // Borders
  border: '#E8EBEF',
  borderLight: '#E8EBEF',
  borderMedium: '#D8DDE3',
  borderDark: '#C5CBD1',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 34,
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
};

export const shadows = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 16,
    elevation: 6,
  },
});