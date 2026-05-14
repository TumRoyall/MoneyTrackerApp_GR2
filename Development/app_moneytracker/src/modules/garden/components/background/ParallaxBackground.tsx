/**
 * ParallaxBackground — Multi-layer scene background.
 * Composes Sky, Mountains, Clouds, Ground, Fog, LightRays, and WeatherParticles.
 * Replaces the old GardenBackground.
 */

import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SkyLayer } from '@/modules/garden/components/background/SkyLayer';
import { MountainLayer } from '@/modules/garden/components/background/MountainLayer';
import { CloudLayer } from '@/modules/garden/components/background/CloudLayer';
import { GroundLayer } from '@/modules/garden/components/background/GroundLayer';
import { LightRays } from '@/modules/garden/components/effects/LightRays';
import { FogLayer } from '@/modules/garden/components/effects/FogLayer';
import { WeatherParticles } from '@/modules/garden/components/effects/WeatherParticles';
import { GardenSparkles } from '@/modules/garden/components/GardenSparkles';
import { getWeatherConfig, mapLegacyWeather } from '@/modules/garden/engine/WeatherEngine';
import { getSeasonConfig } from '@/modules/garden/engine/SeasonManager';
import { getSeasonalPalette } from '@/modules/garden/engine/gardenPalettes';
import type { GardenWeather } from '@/modules/garden/models/garden.types';
import type { WeatherStateV2 } from '@/modules/garden/engine/WeatherEngine';
import type { GardenSeason } from '@/modules/garden/engine/SeasonManager';

type ParallaxBackgroundProps = {
  /** Legacy weather from API (will be mapped to V2) */
  weather?: GardenWeather;
  /** Or use V2 weather directly */
  weatherV2?: WeatherStateV2;
  /** Override season for testing */
  season?: GardenSeason;
  /** Show light rays */
  showLightRays?: boolean;
  /** Show weather particles */
  showParticles?: boolean;
};

export const ParallaxBackground = memo(({
  weather,
  weatherV2,
  season: seasonOverride,
  showLightRays = true,
  showParticles = true,
}: ParallaxBackgroundProps) => {
  const resolvedWeather = weatherV2 ?? (weather ? mapLegacyWeather(weather) : 'sunny');
  const weatherConfig = useMemo(() => getWeatherConfig(resolvedWeather), [resolvedWeather]);
  const seasonConfig = useMemo(() => getSeasonConfig(seasonOverride), [seasonOverride]);
  const palette = useMemo(() => getSeasonalPalette(seasonConfig.season), [seasonConfig.season]);

  const isNight = resolvedWeather === 'night';

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Layer 1: Sky gradient + celestial objects */}
      <SkyLayer
        weatherConfig={weatherConfig}
        palette={palette}
        isNight={isNight}
      />

      {/* Layer 2: Mountains */}
      <MountainLayer palette={palette} />

      {/* Layer 3: Clouds */}
      <CloudLayer
        cloudColor={palette.cloudColor}
        highlightColor={palette.cloudHighlight}
        coverage={weatherConfig.cloudCoverage}
      />

      {/* Layer 4: Ground */}
      <GroundLayer palette={palette} />

      {/* Layer 5: Light rays (atmospheric) */}
      {showLightRays && weatherConfig.showLightRays && (
        <LightRays
          color={weatherConfig.lightColor}
          intensity={weatherConfig.lightIntensity * 0.2}
        />
      )}

      {/* Layer 6: Fog */}
      {weatherConfig.fogDensity > 0 && (
        <FogLayer
          color={palette.fogColor}
          density={weatherConfig.fogDensity}
        />
      )}

      {/* Layer 7: Weather overlay tint */}
      <View style={[styles.overlay, { backgroundColor: weatherConfig.overlayTint }]} />

      {/* Layer 8: Ambient sparkles */}
      <GardenSparkles
        color={weatherConfig.particleColor}
        intensity={isNight ? 0.7 : 0.85}
        count={isNight ? 18 : 12}
      />

      {/* Layer 9: Weather-specific particles */}
      {showParticles && (
        <WeatherParticles
          weather={resolvedWeather}
          season={seasonConfig.season}
          intensity={0.8}
        />
      )}
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
