/**
 * WeatherParticles — Weather-specific particle presets.
 * Uses ParticleLayer with pre-configured settings for each weather effect.
 */

import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { ParticleLayer, ParticleConfig } from '@/modules/garden/components/effects/ParticleLayer';
import type { WeatherStateV2 } from '@/modules/garden/engine/WeatherEngine';
import type { GardenSeason } from '@/modules/garden/engine/SeasonManager';

type WeatherParticlesProps = {
  weather: WeatherStateV2;
  season: GardenSeason;
  /** Overall intensity multiplier */
  intensity?: number;
};

const getWeatherParticleConfigs = (
  weather: WeatherStateV2,
  season: GardenSeason,
  intensity: number,
): ParticleConfig[] => {
  const configs: ParticleConfig[] = [];

  // Rain particles
  if (weather === 'rain') {
    configs.push({
      count: Math.round(25 * intensity),
      shape: 'raindrop',
      motion: 'fall-down',
      color: 'rgba(180, 200, 230, 0.5)',
      sizeRange: [4, 8],
      opacityRange: [0.3, 0.6],
      speed: 1.8,
      windInfluence: 0.3,
    });
  }

  // Snow particles
  if (weather === 'snowfall') {
    configs.push({
      count: Math.round(20 * intensity),
      shape: 'snowflake',
      motion: 'fall-down',
      color: 'rgba(240, 245, 255, 0.8)',
      sizeRange: [3, 7],
      opacityRange: [0.4, 0.8],
      speed: 0.5,
      windInfluence: 0.6,
    });
  }

  // Spring pollen
  if (season === 'spring' && (weather === 'sunny' || weather === 'morning' || weather === 'cloudy')) {
    configs.push({
      count: Math.round(12 * intensity),
      shape: 'circle',
      motion: 'float-up',
      color: 'rgba(255, 230, 140, 0.6)',
      sizeRange: [2, 4],
      opacityRange: [0.3, 0.6],
      speed: 0.4,
      windInfluence: 0.4,
    });
  }

  // Autumn falling leaves
  if (season === 'autumn' && weather !== 'rain') {
    configs.push({
      count: Math.round(8 * intensity),
      shape: 'leaf',
      motion: 'fall-down',
      color: 'rgba(210, 140, 60, 0.6)',
      sizeRange: [5, 10],
      opacityRange: [0.4, 0.7],
      speed: 0.6,
      windInfluence: 0.7,
    });
  }

  // Windy streak particles
  if (weather === 'windy') {
    configs.push({
      count: Math.round(10 * intensity),
      shape: 'circle',
      motion: 'drift-horizontal',
      color: 'rgba(200, 220, 240, 0.3)',
      sizeRange: [2, 4],
      opacityRange: [0.2, 0.4],
      speed: 2.0,
      windInfluence: 1.0,
    });
  }

  // Sunny/sunset sparkle particles
  if (weather === 'sunny' || weather === 'sunset' || weather === 'morning') {
    configs.push({
      count: Math.round(8 * intensity),
      shape: 'circle',
      motion: 'float-up',
      color: weather === 'sunset'
        ? 'rgba(255, 200, 150, 0.5)'
        : 'rgba(255, 244, 210, 0.5)',
      sizeRange: [1.5, 3.5],
      opacityRange: [0.2, 0.5],
      speed: 0.3,
      windInfluence: 0.2,
    });
  }

  // Mist particles (very slow drifting dots)
  if (weather === 'mist') {
    configs.push({
      count: Math.round(6 * intensity),
      shape: 'circle',
      motion: 'drift-horizontal',
      color: 'rgba(220, 230, 245, 0.3)',
      sizeRange: [4, 8],
      opacityRange: [0.15, 0.3],
      speed: 0.2,
      windInfluence: 0.3,
    });
  }

  // Night firefly-like sparkles
  if (weather === 'night') {
    configs.push({
      count: Math.round(10 * intensity),
      shape: 'circle',
      motion: 'float-up',
      color: 'rgba(200, 210, 240, 0.6)',
      sizeRange: [1.5, 3],
      opacityRange: [0.3, 0.7],
      speed: 0.25,
      windInfluence: 0.15,
    });
  }

  return configs;
};

export const WeatherParticles = memo(({ weather, season, intensity = 1.0 }: WeatherParticlesProps) => {
  const configs = useMemo(
    () => getWeatherParticleConfigs(weather, season, intensity),
    [weather, season, intensity],
  );

  if (configs.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {configs.map((config, i) => (
        <ParticleLayer key={`wp-${weather}-${i}`} config={config} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
