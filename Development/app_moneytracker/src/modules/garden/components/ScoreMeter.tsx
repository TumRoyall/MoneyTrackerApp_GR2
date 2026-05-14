import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { GardenScore } from '@/modules/garden/models/garden.types';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

type ScoreMeterProps = {
  score: GardenScore;
};

const SCORE_COLORS = [
  { threshold: 20, color: '#8A7A7A', barStart: '#9A8A8A', barEnd: '#7A6A6A' },
  { threshold: 40, color: '#B8A080', barStart: '#C8B090', barEnd: '#A89070' },
  { threshold: 60, color: '#98C4A0', barStart: '#A8D4B0', barEnd: '#88B490' },
  { threshold: 80, color: '#5ABCB4', barStart: '#6ACCC4', barEnd: '#4AACA4' },
  { threshold: 100, color: '#F0A0B8', barStart: '#FFB8D0', barEnd: '#E090A8' },
];

const getScoreStyle = (value: number) => {
  return SCORE_COLORS.find((c) => value <= c.threshold) ?? SCORE_COLORS[SCORE_COLORS.length - 1];
};

export const ScoreMeter = memo(({ score }: ScoreMeterProps) => {
  const clamped = Math.max(0, Math.min(100, score.value));
  const scoreStyle = getScoreStyle(clamped);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: clamped,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, animWidth]);

  const barWidth = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <GlassCard opacity={0.6} accentColor={scoreStyle.color}>
      <View style={styles.header}>
        <Text style={styles.label}>{score.label}</Text>
        <Text style={[styles.value, { color: scoreStyle.color }]}>{clamped}/100</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { width: barWidth }]}>
          <Svg width="100%" height={12}>
            <Defs>
              <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={scoreStyle.barStart} />
                <Stop offset="1" stopColor={scoreStyle.barEnd} />
              </LinearGradient>
            </Defs>
            <Circle cx="100%" cy="6" r="4" fill={scoreStyle.color} opacity={0.4} />
          </Svg>
          <View style={[styles.barFill, { backgroundColor: scoreStyle.color }]} />
        </Animated.View>
        {/* Glow dot at the end of bar */}
        <Animated.View
          style={[
            styles.glowDot,
            {
              left: barWidth,
              backgroundColor: scoreStyle.color,
            },
          ]}
        />
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#5A6068',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(200, 210, 220, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 99,
    opacity: 0.75,
  },
  glowDot: {
    position: 'absolute',
    top: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.35,
    marginLeft: -6,
  },
});
