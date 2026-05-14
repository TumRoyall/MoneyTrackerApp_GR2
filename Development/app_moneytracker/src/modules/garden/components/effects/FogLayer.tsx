/**
 * FogLayer — Soft horizontal fog bands with gentle drift animation.
 * Used in mist/morning/cloudy weather for atmospheric depth.
 */

import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

type FogLayerProps = {
  color?: string;
  density?: number;
};

const FOG_BANDS = [
  { cx: '30%', cy: '55%', rx: 220, ry: 30, opacity: 0.3 },
  { cx: '70%', cy: '65%', rx: 260, ry: 25, opacity: 0.25 },
  { cx: '50%', cy: '75%', rx: 200, ry: 35, opacity: 0.2 },
  { cx: '20%', cy: '45%', rx: 180, ry: 20, opacity: 0.15 },
];

export const FogLayer = memo(({ color = 'rgba(220, 235, 245, 0.4)', density = 0.5 }: FogLayerProps) => {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [drift]);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  if (density <= 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.fogWrap, { transform: [{ translateX }], opacity: density }]}>
        <Svg width="120%" height="100%" viewBox="0 0 500 400" style={styles.svg}>
          {FOG_BANDS.map((band, i) => (
            <Ellipse
              key={`fog-${i}`}
              cx={250 + (i % 2 === 0 ? -50 : 50)}
              cy={180 + i * 50}
              rx={band.rx}
              ry={band.ry}
              fill={color}
              opacity={band.opacity * density}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  fogWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  svg: {
    position: 'absolute',
    left: '-10%',
    top: 0,
  },
});
