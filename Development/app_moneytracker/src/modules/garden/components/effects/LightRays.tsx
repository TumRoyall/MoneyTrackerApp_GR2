/**
 * LightRays — Diagonal god-ray beams for atmospheric lighting.
 * Subtle, slow-moving light streaks shown during sunny/sunset/morning weather.
 */

import { memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { usePulseAnimation } from '@/modules/garden/components/hooks/usePulseAnimation';

type LightRaysProps = {
  color?: string;
  intensity?: number;
};

const RAY_PATHS = [
  // Three diagonal rays from top-right, varying widths
  'M 200 0 L 260 0 L 120 400 L 80 400 Z',
  'M 280 0 L 320 0 L 180 400 L 160 400 Z',
  'M 340 0 L 400 0 L 260 400 L 220 400 Z',
];

export const LightRays = memo(({ color = '#FFF8E0', intensity = 0.15 }: LightRaysProps) => {
  const pulse = usePulseAnimation(0.5, 1, 8000);
  const opacity = pulse.interpolate({
    inputRange: [0.5, 1],
    outputRange: [intensity * 0.4, intensity],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.rayWrap, { opacity }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="rayGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.35" />
              <Stop offset="0.5" stopColor={color} stopOpacity="0.12" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {RAY_PATHS.map((d, i) => (
            <Path key={`ray-${i}`} d={d} fill="url(#rayGrad)" />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  rayWrap: {
    ...StyleSheet.absoluteFillObject,
  },
});
