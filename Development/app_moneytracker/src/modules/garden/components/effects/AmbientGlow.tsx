/**
 * AmbientGlow — Soft radial glow effect behind the flower.
 * Intensity scales with flower quality.
 */

import { memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

import { usePulseAnimation } from '@/modules/garden/components/hooks/usePulseAnimation';

type AmbientGlowProps = {
  color: string;
  /** 0.0 – 1.0 */
  intensity: number;
  size?: number;
};

export const AmbientGlow = memo(({ color, intensity, size = 300 }: AmbientGlowProps) => {
  const pulse = usePulseAnimation(0.6, 1, 4800);
  const animatedOpacity = pulse.interpolate({
    inputRange: [0.6, 1],
    outputRange: [intensity * 0.4, intensity * 0.7],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.glowWrap, { opacity: animatedOpacity }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="ambGlow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor={color} stopOpacity="0.5" />
              <Stop offset="0.4" stopColor={color} stopOpacity="0.2" />
              <Stop offset="0.7" stopColor={color} stopOpacity="0.08" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ambGlow)" />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
  },
});
