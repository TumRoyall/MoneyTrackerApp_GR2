/**
 * useGardenAtmosphere — Combines season, weather, and flower score
 * into a unified atmosphere configuration for the garden scene.
 */

import { useMemo } from 'react';

import { getSeasonConfig, type GardenSeason, type SeasonConfig } from '@/modules/garden/engine/SeasonManager';
import {
  getWeatherConfig,
  mapLegacyWeather,
  type WeatherStateV2,
  type WeatherVisualConfig,
} from '@/modules/garden/engine/WeatherEngine';
import { getSeasonalPalette, type SeasonalPalette } from '@/modules/garden/engine/gardenPalettes';
import type { GardenWeather, GardenQuality } from '@/modules/garden/models/garden.types';

export interface GardenAtmosphere {
  season: GardenSeason;
  seasonConfig: SeasonConfig;
  weather: WeatherStateV2;
  weatherConfig: WeatherVisualConfig;
  palette: SeasonalPalette;
  /** Combined light intensity from weather + season warmth */
  lightIntensity: number;
  /** Combined wind strength from weather + season base */
  windStrength: number;
  /** Fog density */
  fogDensity: number;
  /** Whether it's nighttime */
  isNight: boolean;
}

/**
 * Hook that produces a complete atmosphere config from legacy weather + quality.
 * Memoized for performance.
 */
export const useGardenAtmosphere = (
  legacyWeather?: GardenWeather,
  quality?: GardenQuality,
  seasonOverride?: GardenSeason,
): GardenAtmosphere => {
  return useMemo(() => {
    const seasonConfig = getSeasonConfig(seasonOverride);
    const weather = legacyWeather ? mapLegacyWeather(legacyWeather) : 'sunny';
    const weatherConfig = getWeatherConfig(weather);
    const palette = getSeasonalPalette(seasonConfig.season);

    const lightIntensity = weatherConfig.lightIntensity * (0.7 + seasonConfig.warmth * 0.3);
    const windStrength = Math.min(1, weatherConfig.windStrength + seasonConfig.windBase * 0.3);
    const fogDensity = weatherConfig.fogDensity;
    const isNight = weather === 'night';

    return {
      season: seasonConfig.season,
      seasonConfig,
      weather,
      weatherConfig,
      palette,
      lightIntensity,
      windStrength,
      fogDensity,
      isNight,
    };
  }, [legacyWeather, quality, seasonOverride]);
};
