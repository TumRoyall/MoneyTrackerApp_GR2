import { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Rect } from 'react-native-svg';

import { qualityTokens } from '@/modules/garden/assets/flowerTokens';
import { useFloatingAnimation } from '@/modules/garden/components/hooks/useFloatingAnimation';
import { GardenFlowerState } from '@/modules/garden/models/garden.types';

type FlowerRendererProps = {
  flower: GardenFlowerState;
  size?: number;
};

const stageScale: Record<GardenFlowerState['stage'], number> = {
  Seed: 0.45,
  Sprout: 0.6,
  YoungPlant: 0.75,
  GrowingPlant: 0.9,
  Budding: 1,
  Blooming: 1.1,
};

export const FlowerRenderer = memo(({ flower, size = 220 }: FlowerRendererProps) => {
  const palette = qualityTokens[flower.quality];
  const { translateY } = useFloatingAnimation(5, 5200);

  const scale = useMemo(() => stageScale[flower.stage], [flower.stage]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={size} height={size} viewBox="0 0 220 220">
          <G transform={`translate(0, ${20 - scale * 4}) scale(${scale})`}>
            <Rect x="54" y="145" width="112" height="52" rx="26" fill="#d9b48f" />
            <Rect x="64" y="138" width="92" height="26" rx="13" fill="#c8a07b" />

            <Rect x="104" y="80" width="12" height="70" rx="6" fill={palette.stem} />
            <Ellipse cx="92" cy="110" rx="22" ry="14" fill={palette.leaf} opacity={0.85} />
            <Ellipse cx="126" cy="98" rx="18" ry="12" fill={palette.leaf} opacity={0.75} />

            <G transform="translate(110 70)">
              <Ellipse cx="0" cy="-18" rx="22" ry="14" fill={palette.petal} />
              <Ellipse cx="0" cy="18" rx="22" ry="14" fill={palette.petal} />
              <Ellipse cx="-18" cy="0" rx="14" ry="22" fill={palette.petal} />
              <Ellipse cx="18" cy="0" rx="14" ry="22" fill={palette.petal} />
              <Circle cx="0" cy="0" r="12" fill={palette.center} />
            </G>

            {flower.quality === 'excellent' && (
              <G opacity={0.65}>
                <Circle cx="72" cy="60" r="6" fill={palette.glow} />
                <Circle cx="152" cy="52" r="5" fill={palette.glow} />
                <Circle cx="170" cy="92" r="4" fill={palette.glow} />
              </G>
            )}
          </G>
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
});
