/**
 * GardenSparkles — Enhanced sparkle system with staggered timing,
 * randomized sizes, and twinkle effects (scale + opacity combined).
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, type DimensionValue, Easing, StyleSheet, View } from 'react-native';

type GardenSparklesProps = {
  color: string;
  intensity?: number;
  count?: number;
};

interface SparkleData {
  left: DimensionValue;
  top: DimensionValue;
  size: number;
  animValue: Animated.Value;
  delay: number;
  duration: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const GardenSparkles = memo(({ color, intensity = 1, count = 14 }: GardenSparklesProps) => {
  const sparkles = useMemo<SparkleData[]>(() => {
    return Array.from({ length: count }, () => ({
      left: `${rand(5, 95)}%` as DimensionValue,
      top: `${rand(8, 75)}%` as DimensionValue,
      size: rand(3, 7) * intensity,
      animValue: new Animated.Value(0),
      delay: rand(0, 3000),
      duration: rand(2000, 4500),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, intensity]);

  useEffect(() => {
    const animations = sparkles.map((s) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(s.animValue, {
            toValue: 1,
            duration: s.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(s.animValue, {
            toValue: 0,
            duration: s.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [sparkles]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {sparkles.map((sparkle, index) => {
        const opacity = sparkle.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.1, 0.8],
        });
        const scale = sparkle.animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1.2, 0.6],
        });

        return (
          <Animated.View
            key={`sparkle-${index}`}
            style={[
              styles.sparkle,
              {
                left: sparkle.left,
                top: sparkle.top,
                width: sparkle.size,
                height: sparkle.size,
                borderRadius: sparkle.size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
  },
});
