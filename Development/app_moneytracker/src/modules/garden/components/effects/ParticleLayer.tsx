/**
 * ParticleLayer — Generic animated particle system.
 * Renders configurable floating/falling particles using Animated API.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type ParticleShape = 'circle' | 'petal' | 'leaf' | 'snowflake' | 'raindrop';
export type ParticleMotion = 'float-up' | 'fall-down' | 'drift-horizontal' | 'swirl';

export interface ParticleConfig {
  /** Number of particles */
  count: number;
  /** Particle shape */
  shape: ParticleShape;
  /** Movement pattern */
  motion: ParticleMotion;
  /** Color */
  color: string;
  /** Size range [min, max] */
  sizeRange: [number, number];
  /** Opacity range [min, max] */
  opacityRange: [number, number];
  /** Speed multiplier (1.0 = normal) */
  speed: number;
  /** Wind influence (0.0–1.0) */
  windInfluence: number;
}

interface ParticleData {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  animValue: Animated.Value;
  driftValue: Animated.Value;
}

const AnimatedView = Animated.View;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const ParticleShape_ = memo(({ shape, size, color }: { shape: ParticleShape; size: number; color: string }) => {
  const s = size * 4; // SVG viewbox scaling
  switch (shape) {
    case 'circle':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={s / 2} cy={s / 2} r={s / 2 - 0.5} fill={color} />
        </Svg>
      );
    case 'petal':
      return (
        <Svg width={size * 1.2} height={size * 1.8} viewBox="0 0 12 18">
          <Path
            d="M 6 0 Q 12 6 6 18 Q 0 6 6 0 Z"
            fill={color}
          />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg width={size * 1.5} height={size} viewBox="0 0 18 10">
          <Path
            d="M 0 5 Q 4 0 9 0 Q 14 0 18 5 Q 14 10 9 10 Q 4 10 0 5 Z"
            fill={color}
          />
        </Svg>
      );
    case 'snowflake':
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
          <Circle cx={s / 2} cy={s / 2} r={s / 2 - 0.5} fill={color} />
          <Circle cx={s / 2} cy={s / 2} r={s / 3} fill="#FFFFFF" opacity={0.4} />
        </Svg>
      );
    case 'raindrop':
      return (
        <Svg width={size * 0.4} height={size * 2} viewBox="0 0 4 20">
          <Ellipse cx={2} cy={10} rx={1.5} ry={9} fill={color} />
        </Svg>
      );
    default:
      return null;
  }
});

export const ParticleLayer = memo(({ config }: { config: ParticleConfig }) => {
  const particles = useMemo<ParticleData[]>(() => {
    return Array.from({ length: config.count }, (_, i) => ({
      x: rand(5, 95),
      y: config.motion === 'fall-down' ? rand(-20, -5) : rand(105, 120),
      size: rand(config.sizeRange[0], config.sizeRange[1]),
      opacity: rand(config.opacityRange[0], config.opacityRange[1]),
      delay: rand(0, 4000),
      duration: rand(4000, 8000) / config.speed,
      animValue: new Animated.Value(0),
      driftValue: new Animated.Value(0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.count, config.shape, config.motion]);

  useEffect(() => {
    const animations = particles.map((p) => {
      const mainAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.animValue, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      const driftAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(p.driftValue, {
            toValue: 1,
            duration: p.duration * 0.8,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.driftValue, {
            toValue: -1,
            duration: p.duration * 1.2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.driftValue, {
            toValue: 0,
            duration: p.duration * 0.6,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      return { main: mainAnim, drift: driftAnim };
    });

    animations.forEach((a) => {
      a.main.start();
      a.drift.start();
    });

    return () => {
      animations.forEach((a) => {
        a.main.stop();
        a.drift.stop();
      });
    };
  }, [particles]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {particles.map((p, i) => {
        const isDown = config.motion === 'fall-down';
        const translateY = p.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: isDown ? [-50, 500] : [500, -50],
        });
        const translateX = p.driftValue.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-15 * config.windInfluence, 0, 15 * config.windInfluence],
        });
        const opacity = p.animValue.interpolate({
          inputRange: [0, 0.15, 0.85, 1],
          outputRange: [0, p.opacity, p.opacity, 0],
        });

        return (
          <AnimatedView
            key={`particle-${i}`}
            style={[
              styles.particle,
              {
                left: `${p.x}%` as `${number}%`,
                transform: [{ translateY }, { translateX }],
                opacity,
              },
            ]}
          >
            <ParticleShape_ shape={config.shape} size={p.size} color={config.color} />
          </AnimatedView>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
