/**
 * WeatherEngine — Expanded weather system with 9 states.
 * Resolves weather based on flower score quality + season bias.
 */

import type { GardenQuality, GardenWeather } from '@/modules/garden/models/garden.types';
import type { GardenSeason } from '@/modules/garden/engine/SeasonManager';

export type WeatherStateV2 =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'mist'
  | 'windy'
  | 'night'
  | 'snowfall'
  | 'sunset'
  | 'morning';

export interface WeatherVisualConfig {
  /** 5-stop sky gradient (top → bottom) */
  skyGradient: string[];
  /** Overlay tint color */
  overlayTint: string;
  /** Light color cast over the scene */
  lightColor: string;
  /** Light intensity 0.0–1.0 */
  lightIntensity: number;
  /** Fog density 0.0–1.0 */
  fogDensity: number;
  /** Wind strength 0.0–1.0 */
  windStrength: number;
  /** Cloud coverage 0.0–1.0 */
  cloudCoverage: number;
  /** Sparkle/particle color */
  particleColor: string;
  /** Whether light rays should render */
  showLightRays: boolean;
  /** Rain intensity 0.0–1.0 (0 = no rain) */
  rainIntensity: number;
  /** Snow intensity 0.0–1.0 (0 = no snow) */
  snowIntensity: number;
}

export const WEATHER_CONFIGS: Record<WeatherStateV2, WeatherVisualConfig> = {
  sunny: {
    skyGradient: ['#87CEEB', '#A8D8EA', '#C5E8F7', '#E8F4EC', '#F0F7E8'],
    overlayTint: 'rgba(255, 220, 130, 0.12)',
    lightColor: '#FFF5D4',
    lightIntensity: 0.9,
    fogDensity: 0.0,
    windStrength: 0.15,
    cloudCoverage: 0.15,
    particleColor: 'rgba(255, 244, 210, 0.7)',
    showLightRays: true,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  morning: {
    skyGradient: ['#FFD4A8', '#FFE4C4', '#FFF0DB', '#E8F4EC', '#DCF0E6'],
    overlayTint: 'rgba(255, 200, 140, 0.14)',
    lightColor: '#FFE8C8',
    lightIntensity: 0.7,
    fogDensity: 0.25,
    windStrength: 0.1,
    cloudCoverage: 0.2,
    particleColor: 'rgba(255, 230, 180, 0.6)',
    showLightRays: true,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  sunset: {
    skyGradient: ['#FF9A76', '#FFBC96', '#FFD4B8', '#E8C8D8', '#C8A8D8'],
    overlayTint: 'rgba(255, 160, 100, 0.16)',
    lightColor: '#FFD0A0',
    lightIntensity: 0.65,
    fogDensity: 0.1,
    windStrength: 0.1,
    cloudCoverage: 0.3,
    particleColor: 'rgba(255, 200, 150, 0.6)',
    showLightRays: true,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  cloudy: {
    skyGradient: ['#C8D0DC', '#D4DCE8', '#DEE4EC', '#E8ECF0', '#EEF0F4'],
    overlayTint: 'rgba(180, 195, 215, 0.18)',
    lightColor: '#E8ECF4',
    lightIntensity: 0.45,
    fogDensity: 0.15,
    windStrength: 0.25,
    cloudCoverage: 0.7,
    particleColor: 'rgba(220, 230, 245, 0.4)',
    showLightRays: false,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  rain: {
    skyGradient: ['#9EAAB8', '#B0BCC8', '#C0CCD8', '#D0D8E0', '#DCE0E8'],
    overlayTint: 'rgba(140, 160, 185, 0.22)',
    lightColor: '#D8E0EC',
    lightIntensity: 0.35,
    fogDensity: 0.2,
    windStrength: 0.3,
    cloudCoverage: 0.85,
    particleColor: 'rgba(200, 215, 235, 0.35)',
    showLightRays: false,
    rainIntensity: 0.7,
    snowIntensity: 0.0,
  },
  mist: {
    skyGradient: ['#D8DDE5', '#E0E5EC', '#E8ECF0', '#EEF0F4', '#F4F5F8'],
    overlayTint: 'rgba(200, 210, 225, 0.25)',
    lightColor: '#ECF0F4',
    lightIntensity: 0.4,
    fogDensity: 0.6,
    windStrength: 0.05,
    cloudCoverage: 0.5,
    particleColor: 'rgba(230, 235, 245, 0.3)',
    showLightRays: false,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  windy: {
    skyGradient: ['#A0C4E0', '#B8D4EC', '#CCE0F0', '#E0ECF4', '#ECF2F8'],
    overlayTint: 'rgba(160, 190, 220, 0.14)',
    lightColor: '#E0ECF8',
    lightIntensity: 0.55,
    fogDensity: 0.05,
    windStrength: 0.8,
    cloudCoverage: 0.4,
    particleColor: 'rgba(210, 230, 250, 0.4)',
    showLightRays: false,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  night: {
    skyGradient: ['#1A1A2E', '#2A2A4E', '#3A3A5E', '#2E3A4E', '#1E2A3E'],
    overlayTint: 'rgba(20, 25, 50, 0.3)',
    lightColor: '#C8D0E8',
    lightIntensity: 0.2,
    fogDensity: 0.1,
    windStrength: 0.1,
    cloudCoverage: 0.1,
    particleColor: 'rgba(200, 210, 240, 0.5)',
    showLightRays: false,
    rainIntensity: 0.0,
    snowIntensity: 0.0,
  },
  snowfall: {
    skyGradient: ['#C8D4E0', '#D4DCE8', '#E0E8F0', '#E8EEF4', '#F0F4F8'],
    overlayTint: 'rgba(210, 225, 240, 0.2)',
    lightColor: '#E8F0F8',
    lightIntensity: 0.5,
    fogDensity: 0.3,
    windStrength: 0.15,
    cloudCoverage: 0.6,
    particleColor: 'rgba(240, 245, 255, 0.7)',
    showLightRays: false,
    rainIntensity: 0.0,
    snowIntensity: 0.8,
  },
};

/**
 * Weather probability weights per quality level.
 * Higher quality → more pleasant weather.
 */
const QUALITY_WEATHER_WEIGHTS: Record<GardenQuality, Partial<Record<WeatherStateV2, number>>> = {
  excellent: { sunny: 35, morning: 20, sunset: 15, cloudy: 5, mist: 5, windy: 5, rain: 2, night: 8, snowfall: 5 },
  good:      { sunny: 25, morning: 18, sunset: 12, cloudy: 12, mist: 8, windy: 8, rain: 5, night: 7, snowfall: 5 },
  average:   { sunny: 15, morning: 15, sunset: 10, cloudy: 18, mist: 12, windy: 10, rain: 8, night: 7, snowfall: 5 },
  poor:      { sunny: 8,  morning: 8,  sunset: 5,  cloudy: 22, mist: 15, windy: 12, rain: 15, night: 8, snowfall: 7 },
  terrible:  { sunny: 3,  morning: 4,  sunset: 3,  cloudy: 25, mist: 15, windy: 15, rain: 20, night: 8, snowfall: 7 },
};

/** Season modifiers — boost certain weather types per season */
const SEASON_WEATHER_BOOST: Record<GardenSeason, Partial<Record<WeatherStateV2, number>>> = {
  spring:  { morning: 5, sunny: 3, rain: 3, mist: 4 },
  summer:  { sunny: 8, sunset: 3 },
  autumn:  { cloudy: 5, windy: 5, mist: 3, rain: 2 },
  winter:  { snowfall: 15, cloudy: 5, night: 3 },
};

/**
 * Resolve the visual weather state based on score quality and season.
 * Uses weighted random selection so it's not deterministic.
 */
export const resolveWeatherV2 = (
  quality: GardenQuality,
  season: GardenSeason,
): WeatherStateV2 => {
  const baseWeights = { ...QUALITY_WEATHER_WEIGHTS[quality] };
  const seasonBoost = SEASON_WEATHER_BOOST[season];

  // Apply season boosts
  for (const [weather, boost] of Object.entries(seasonBoost)) {
    const key = weather as WeatherStateV2;
    baseWeights[key] = (baseWeights[key] ?? 0) + (boost ?? 0);
  }

  // Weighted random pick
  const entries = Object.entries(baseWeights) as [WeatherStateV2, number][];
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * totalWeight;

  for (const [weather, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return weather;
  }

  return 'sunny';
};

/**
 * Map the legacy 5-state GardenWeather to the new V2 system.
 * Used for backward compatibility with the existing API.
 */
export const mapLegacyWeather = (legacy: GardenWeather): WeatherStateV2 => {
  const mapping: Record<GardenWeather, WeatherStateV2> = {
    sunny: 'sunny',
    cloudy: 'cloudy',
    rainy: 'rain',
    stormy: 'rain',
    glowy: 'sunset',
  };
  return mapping[legacy];
};

/**
 * Get the visual config for a weather state.
 */
export const getWeatherConfig = (weather: WeatherStateV2): WeatherVisualConfig => {
  return WEATHER_CONFIGS[weather];
};
