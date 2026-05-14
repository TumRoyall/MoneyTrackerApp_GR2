/**
 * useAnimationLoop — Central animation timing hook.
 * Provides shared animated values for wind sway, ambient pulse, and drift
 * so multiple components share the same timing without redundant loops.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export interface AnimationLoopValues {
  /** Wind sway oscillation: -1 to 1, period ~6s */
  windSway: Animated.Value;
  /** Ambient pulse: 0 to 1, period ~4s */
  ambientPulse: Animated.Value;
  /** Slow drift: 0 to 1, period ~20s (for cloud/fog movement) */
  slowDrift: Animated.Value;
  /** Fast twinkle: 0 to 1, period ~2s (for sparkles) */
  fastTwinkle: Animated.Value;
}

/**
 * Creates and manages shared animation loops.
 * @param windStrength - 0.0 to 1.0 multiplier for wind sway amplitude (used for interpolation by consumers)
 */
export const useAnimationLoop = (windStrength = 0.3): AnimationLoopValues => {
  const windSway = useRef(new Animated.Value(0)).current;
  const ambientPulse = useRef(new Animated.Value(0)).current;
  const slowDrift = useRef(new Animated.Value(0)).current;
  const fastTwinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const windDuration = 6000 / Math.max(0.2, windStrength);

    const animations = [
      // Wind sway: smooth sinusoidal, -1 → 1 → -1
      Animated.loop(
        Animated.sequence([
          Animated.timing(windSway, {
            toValue: 1,
            duration: windDuration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(windSway, {
            toValue: -1,
            duration: windDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(windSway, {
            toValue: 0,
            duration: windDuration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      // Ambient pulse: 0 → 1 → 0
      Animated.loop(
        Animated.sequence([
          Animated.timing(ambientPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ambientPulse, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
      // Slow drift: 0 → 1, continuous (for translateX interpolation)
      Animated.loop(
        Animated.timing(slowDrift, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      // Fast twinkle: rapid pulse for sparkle effects
      Animated.loop(
        Animated.sequence([
          Animated.timing(fastTwinkle, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(fastTwinkle, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [windStrength, windSway, ambientPulse, slowDrift, fastTwinkle]);

  return useMemo(
    () => ({ windSway, ambientPulse, slowDrift, fastTwinkle }),
    [windSway, ambientPulse, slowDrift, fastTwinkle],
  );
};
