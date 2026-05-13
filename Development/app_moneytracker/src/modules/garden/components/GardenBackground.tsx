import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { weatherTokens } from '@/modules/garden/assets/flowerTokens';
import { GardenWeather } from '@/modules/garden/models/garden.types';
import { GardenSparkles } from '@/modules/garden/components/GardenSparkles';

type GardenBackgroundProps = {
  weather: GardenWeather;
};

export const GardenBackground = memo(({ weather }: GardenBackgroundProps) => {
  const tokens = weatherTokens[weather];

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="gardenGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tokens.background[0]} stopOpacity="1" />
            <Stop offset="0.5" stopColor={tokens.background[1]} stopOpacity="1" />
            <Stop offset="1" stopColor={tokens.background[2]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#gardenGradient)" />
      </Svg>
      <View style={[styles.overlay, { backgroundColor: tokens.overlay }]} />
      <GardenSparkles color={tokens.sparkle} intensity={weather === 'glowy' ? 1.2 : 0.9} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
