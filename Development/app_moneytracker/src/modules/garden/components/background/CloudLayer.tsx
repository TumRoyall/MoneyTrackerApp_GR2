/**
 * CloudLayer — Animated floating clouds that drift horizontally.
 * Cloud density varies with weather (more = cloudy/rainy, fewer = sunny).
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G } from 'react-native-svg';

type CloudLayerProps = {
  cloudColor: string;
  highlightColor: string;
  /** 0.0–1.0 */
  coverage: number;
};

interface CloudData {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
  animValue: Animated.Value;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const CloudShape = memo(({ color, highlight, scale }: { color: string; highlight: string; scale: number }) => {
  const w = 80 * scale;
  const h = 30 * scale;
  return (
    <Svg width={w} height={h} viewBox="0 0 80 30">
      <Ellipse cx="40" cy="18" rx="36" ry="12" fill={color} opacity={0.8} />
      <Ellipse cx="28" cy="14" rx="22" ry="10" fill={color} opacity={0.9} />
      <Ellipse cx="52" cy="14" rx="20" ry="9" fill={color} opacity={0.85} />
      <Ellipse cx="40" cy="12" rx="18" ry="8" fill={highlight} opacity={0.4} />
    </Svg>
  );
});

export const CloudLayer = memo(({ cloudColor, highlightColor, coverage }: CloudLayerProps) => {
  const cloudCount = Math.max(1, Math.round(coverage * 6));

  const clouds = useMemo<CloudData[]>(() => {
    return Array.from({ length: cloudCount }, () => ({
      x: rand(-20, 110),
      y: rand(5, 35),
      scale: rand(0.5, 1.3),
      opacity: rand(0.3, 0.8),
      speed: rand(25000, 50000),
      animValue: new Animated.Value(rand(0, 1)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudCount]);

  useEffect(() => {
    const animations = clouds.map((cloud) =>
      Animated.loop(
        Animated.timing(cloud.animValue, {
          toValue: 1,
          duration: cloud.speed,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [clouds]);

  if (coverage <= 0.05) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {clouds.map((cloud, i) => {
        const translateX = cloud.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 80],
        });

        return (
          <Animated.View
            key={`cloud-${i}`}
            style={[
              styles.cloud,
              {
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                opacity: cloud.opacity * coverage,
                transform: [{ translateX }],
              },
            ]}
          >
            <CloudShape color={cloudColor} highlight={highlightColor} scale={cloud.scale} />
          </Animated.View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '8%',
    left: 0,
    right: 0,
    height: '35%',
  },
  cloud: {
    position: 'absolute',
  },
});
