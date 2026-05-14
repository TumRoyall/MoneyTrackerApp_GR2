/**
 * GlassCard — Reusable glassmorphism card component.
 * Semi-transparent background with subtle border and soft shadow.
 */

import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** Background opacity (0.0–1.0, default 0.65) */
  opacity?: number;
  /** Border accent color (optional gradient-like accent at top) */
  accentColor?: string;
};

export const GlassCard = memo(({ children, style, opacity = 0.65, accentColor }: GlassCardProps) => {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: `rgba(255, 255, 255, ${opacity})` },
        style,
      ]}
    >
      {accentColor && (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      )}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 2.5,
    borderRadius: 2,
    opacity: 0.5,
  },
});
