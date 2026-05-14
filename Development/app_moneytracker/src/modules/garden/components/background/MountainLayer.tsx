/**
 * MountainLayer — Layered mountain silhouettes with depth fog coloring.
 * Far mountains are more faded, near mountains more saturated.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { SeasonalPalette } from '@/modules/garden/engine/gardenPalettes';

type MountainLayerProps = {
  palette: SeasonalPalette;
};

export const MountainLayer = memo(({ palette }: MountainLayerProps) => {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
        {/* Far mountains — most faded */}
        <Path
          d="M 0 160 Q 40 100 80 130 Q 120 80 160 120 Q 200 70 240 110 Q 280 60 320 120 Q 360 90 400 140 L 400 200 L 0 200 Z"
          fill={palette.mountains.far}
          opacity={0.6}
        />
        {/* Mid mountains */}
        <Path
          d="M 0 170 Q 50 120 100 150 Q 150 100 200 140 Q 250 90 300 140 Q 350 110 400 155 L 400 200 L 0 200 Z"
          fill={palette.mountains.mid}
          opacity={0.7}
        />
        {/* Near hills — most saturated */}
        <Path
          d="M 0 180 Q 60 150 120 168 Q 180 135 240 165 Q 300 140 360 170 Q 380 160 400 175 L 400 200 L 0 200 Z"
          fill={palette.mountains.near}
          opacity={0.8}
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '30%',
  },
});
