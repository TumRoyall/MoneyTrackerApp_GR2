/**
 * SkyLayer — Sky gradient with optional celestial objects (sun/moon/stars).
 * Weather and season aware.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { WeatherVisualConfig } from '@/modules/garden/engine/WeatherEngine';
import type { SeasonalPalette } from '@/modules/garden/engine/gardenPalettes';

type SkyLayerProps = {
  weatherConfig: WeatherVisualConfig;
  palette: SeasonalPalette;
  isNight: boolean;
};

export const SkyLayer = memo(({ weatherConfig, palette, isNight }: SkyLayerProps) => {
  const grad = weatherConfig.skyGradient;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={grad[0]} />
            <Stop offset="0.25" stopColor={grad[1]} />
            <Stop offset="0.5" stopColor={grad[2]} />
            <Stop offset="0.75" stopColor={grad[3]} />
            <Stop offset="1" stopColor={grad[4]} />
          </LinearGradient>
          <RadialGradient id="celestGlow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
            <Stop offset="0" stopColor={palette.celestialGlow} stopOpacity="0.6" />
            <Stop offset="0.5" stopColor={palette.celestialGlow} stopOpacity="0.2" />
            <Stop offset="1" stopColor={palette.celestialGlow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#skyGrad)" />

        {/* Sun/Moon glow */}
        {!isNight && (
          <>
            <Circle cx="75" cy="15" r="18" fill="url(#celestGlow)" />
            <Circle cx="75" cy="15" r="5" fill={palette.celestialColor} opacity={0.9} />
          </>
        )}

        {/* Night stars */}
        {isNight && (
          <>
            {[
              { cx: 15, cy: 8, r: 0.6 },
              { cx: 30, cy: 5, r: 0.4 },
              { cx: 50, cy: 12, r: 0.5 },
              { cx: 65, cy: 7, r: 0.3 },
              { cx: 80, cy: 15, r: 0.5 },
              { cx: 90, cy: 8, r: 0.4 },
              { cx: 25, cy: 18, r: 0.3 },
              { cx: 45, cy: 22, r: 0.4 },
              { cx: 70, cy: 20, r: 0.6 },
              { cx: 10, cy: 25, r: 0.3 },
              { cx: 55, cy: 28, r: 0.5 },
              { cx: 85, cy: 25, r: 0.4 },
            ].map((star, i) => (
              <Circle
                key={`star-${i}`}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                fill={palette.starColor}
              />
            ))}
            {/* Moon */}
            <Circle cx="78" cy="14" r="4" fill={palette.celestialColor} opacity={0.85} />
            <Circle cx="76" cy="12" r="3.5" fill={grad[0]} opacity={0.7} />
          </>
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
