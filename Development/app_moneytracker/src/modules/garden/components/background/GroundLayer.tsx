/**
 * GroundLayer — Ground plane with grass detail.
 * Season-aware colors (green spring, deep summer, amber autumn, snow winter).
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { SeasonalPalette } from '@/modules/garden/engine/gardenPalettes';

type GroundLayerProps = {
  palette: SeasonalPalette;
};

export const GroundLayer = memo(({ palette }: GroundLayerProps) => {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.ground.highlight} stopOpacity="0.9" />
            <Stop offset="0.4" stopColor={palette.ground.base} stopOpacity="1" />
            <Stop offset="1" stopColor={palette.ground.shadow} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Main ground shape with gentle hill curve */}
        <Path
          d="M 0 30 Q 100 10 200 25 Q 300 5 400 20 L 400 120 L 0 120 Z"
          fill="url(#groundGrad)"
        />

        {/* Subtle grass tufts */}
        {[30, 80, 140, 200, 260, 320, 370].map((x, i) => (
          <Path
            key={`grass-${i}`}
            d={`M ${x} ${20 + Math.sin(i * 1.2) * 8} Q ${x + 3} ${10 + Math.sin(i * 1.2) * 8} ${x + 1} ${20 + Math.sin(i * 1.2) * 8}`}
            stroke={palette.ground.highlight}
            strokeWidth={1.5}
            fill="none"
            opacity={0.5}
          />
        ))}

        {/* Small ground detail dots */}
        {[60, 150, 250, 340].map((x, i) => (
          <Ellipse
            key={`detail-${i}`}
            cx={x}
            cy={40 + i * 8}
            rx={4}
            ry={2}
            fill={palette.ground.shadow}
            opacity={0.2}
          />
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '18%',
  },
});
