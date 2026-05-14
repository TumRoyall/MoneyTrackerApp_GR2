/**
 * gardenPalettes — Centralized seasonal color palette system.
 * Provides season-specific colors for mountains, grass, fog, and atmospheric tones.
 */

import type { GardenSeason } from '@/modules/garden/engine/SeasonManager';

export interface SeasonalPalette {
  /** Mountain silhouette colors (far → near) */
  mountains: {
    far: string;
    mid: string;
    near: string;
  };
  /** Ground/grass colors */
  ground: {
    base: string;
    highlight: string;
    shadow: string;
  };
  /** Cloud tint */
  cloudColor: string;
  cloudHighlight: string;
  /** Fog tint */
  fogColor: string;
  /** Ambient floating particle color */
  ambientParticle: string;
  /** Falling particle color (leaves/snow) */
  fallingParticle: string;
  /** Celestial object color (sun/moon) */
  celestialColor: string;
  celestialGlow: string;
  /** Star color (night only, but defined for all) */
  starColor: string;
}

export const SEASONAL_PALETTES: Record<GardenSeason, SeasonalPalette> = {
  spring: {
    mountains: {
      far: '#B8CCB0',
      mid: '#9AB892',
      near: '#7DA87A',
    },
    ground: {
      base: '#8BC48A',
      highlight: '#A8D8A0',
      shadow: '#6AAE68',
    },
    cloudColor: '#FFFFFF',
    cloudHighlight: '#FFF8F0',
    fogColor: 'rgba(220, 235, 210, 0.35)',
    ambientParticle: 'rgba(255, 230, 140, 0.6)',
    fallingParticle: 'rgba(255, 200, 210, 0.5)',
    celestialColor: '#FFF5D4',
    celestialGlow: 'rgba(255, 240, 180, 0.4)',
    starColor: 'rgba(255, 255, 240, 0.7)',
  },
  summer: {
    mountains: {
      far: '#8AAE90',
      mid: '#6A9A70',
      near: '#5A8A60',
    },
    ground: {
      base: '#5EAA5C',
      highlight: '#78C478',
      shadow: '#488A48',
    },
    cloudColor: '#FFFFFF',
    cloudHighlight: '#FFF8EC',
    fogColor: 'rgba(230, 240, 210, 0.25)',
    ambientParticle: 'rgba(255, 244, 180, 0.5)',
    fallingParticle: 'rgba(255, 220, 160, 0.4)',
    celestialColor: '#FFFAD4',
    celestialGlow: 'rgba(255, 245, 160, 0.5)',
    starColor: 'rgba(255, 255, 230, 0.7)',
  },
  autumn: {
    mountains: {
      far: '#C4AA88',
      mid: '#B0966E',
      near: '#9A8060',
    },
    ground: {
      base: '#B89860',
      highlight: '#D0B478',
      shadow: '#9A7A48',
    },
    cloudColor: '#F0E8E0',
    cloudHighlight: '#F8F0E4',
    fogColor: 'rgba(220, 200, 170, 0.35)',
    ambientParticle: 'rgba(255, 200, 120, 0.5)',
    fallingParticle: 'rgba(210, 140, 60, 0.6)',
    celestialColor: '#FFE8C0',
    celestialGlow: 'rgba(255, 220, 150, 0.4)',
    starColor: 'rgba(255, 240, 210, 0.7)',
  },
  winter: {
    mountains: {
      far: '#C8D4E0',
      mid: '#B0C0D0',
      near: '#98ACC0',
    },
    ground: {
      base: '#D8E0E8',
      highlight: '#E8EEF4',
      shadow: '#B0BCC8',
    },
    cloudColor: '#E8EEF4',
    cloudHighlight: '#F4F8FC',
    fogColor: 'rgba(210, 225, 240, 0.4)',
    ambientParticle: 'rgba(220, 235, 255, 0.5)',
    fallingParticle: 'rgba(245, 248, 255, 0.8)',
    celestialColor: '#E0E8F4',
    celestialGlow: 'rgba(200, 215, 240, 0.35)',
    starColor: 'rgba(230, 240, 255, 0.8)',
  },
};

/**
 * Get the seasonal palette for a given season.
 */
export const getSeasonalPalette = (season: GardenSeason): SeasonalPalette => {
  return SEASONAL_PALETTES[season];
};
