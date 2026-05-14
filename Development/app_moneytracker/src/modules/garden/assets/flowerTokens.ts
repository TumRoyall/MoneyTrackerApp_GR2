import { GardenQuality, GardenWeather } from '@/modules/garden/models/garden.types';

/** Extended quality color tokens for the premium flower renderer */
export interface QualityTokensV2 {
  petal: string;
  petalHighlight: string;
  petalShadow: string;
  center: string;
  stamen: string;
  leaf: string;
  leafHighlight: string;
  stem: string;
  glow: string;
  shadow: string;
  dewdrop: string;
  potBody: string;
  potRim: string;
  potShadow: string;
  soilDark: string;
  soilLight: string;
  /** Overall vibrancy 0.0–1.0 */
  vibrancy: number;
}

/** V1 backward-compatible tokens (kept for any old references) */
export const qualityTokens: Record<
  GardenQuality,
  {
    petal: string;
    center: string;
    leaf: string;
    stem: string;
    glow: string;
    shadow: string;
  }
> = {
  terrible: {
    petal: '#6a6a6a',
    center: '#7b7b7b',
    leaf: '#5f6d6a',
    stem: '#4e5b58',
    glow: 'rgba(0,0,0,0.12)',
    shadow: 'rgba(0,0,0,0.25)',
  },
  poor: {
    petal: '#8a7f86',
    center: '#9b8a8e',
    leaf: '#6f837b',
    stem: '#5f746f',
    glow: 'rgba(110,110,110,0.18)',
    shadow: 'rgba(0,0,0,0.22)',
  },
  average: {
    petal: '#c3b2bd',
    center: '#d4caa8',
    leaf: '#87b69b',
    stem: '#6e9a87',
    glow: 'rgba(210,200,180,0.22)',
    shadow: 'rgba(0,0,0,0.18)',
  },
  good: {
    petal: '#f3b6c8',
    center: '#f6e1a4',
    leaf: '#7ecaa7',
    stem: '#5aa384',
    glow: 'rgba(255,214,170,0.3)',
    shadow: 'rgba(0,0,0,0.14)',
  },
  excellent: {
    petal: '#f7a5c4',
    center: '#fff0b0',
    leaf: '#76d3b1',
    stem: '#4ea98c',
    glow: 'rgba(255,222,160,0.4)',
    shadow: 'rgba(0,0,0,0.12)',
  },
};

/** V2 extended quality tokens with richer detail */
export const qualityTokensV2: Record<GardenQuality, QualityTokensV2> = {
  terrible: {
    petal: '#6a6a6a',
    petalHighlight: '#7a7a7a',
    petalShadow: '#525252',
    center: '#7b7b7b',
    stamen: '#656565',
    leaf: '#5f6d6a',
    leafHighlight: '#6d7d78',
    stem: '#4e5b58',
    glow: 'rgba(0,0,0,0.08)',
    shadow: 'rgba(0,0,0,0.25)',
    dewdrop: 'rgba(180,180,180,0.3)',
    potBody: '#8B7355',
    potRim: '#7A6248',
    potShadow: '#5C4A38',
    soilDark: '#5A4A3A',
    soilLight: '#6B5B4B',
    vibrancy: 0.2,
  },
  poor: {
    petal: '#8a7f86',
    petalHighlight: '#9E9298',
    petalShadow: '#726870',
    center: '#9b8a8e',
    stamen: '#8A7A7E',
    leaf: '#6f837b',
    leafHighlight: '#82978E',
    stem: '#5f746f',
    glow: 'rgba(110,110,110,0.14)',
    shadow: 'rgba(0,0,0,0.22)',
    dewdrop: 'rgba(200,210,220,0.35)',
    potBody: '#9B8060',
    potRim: '#8A7050',
    potShadow: '#6A5540',
    soilDark: '#6A5A48',
    soilLight: '#7E6E5A',
    vibrancy: 0.35,
  },
  average: {
    petal: '#C8A8B8',
    petalHighlight: '#D8BCC8',
    petalShadow: '#A890A0',
    center: '#D4CCA8',
    stamen: '#C8B888',
    leaf: '#87B69B',
    leafHighlight: '#9CCAAE',
    stem: '#6E9A87',
    glow: 'rgba(210,200,180,0.18)',
    shadow: 'rgba(0,0,0,0.16)',
    dewdrop: 'rgba(200,230,250,0.45)',
    potBody: '#B08860',
    potRim: '#C49870',
    potShadow: '#8A6848',
    soilDark: '#7A6850',
    soilLight: '#8E7C64',
    vibrancy: 0.55,
  },
  good: {
    petal: '#F0A0B8',
    petalHighlight: '#F8BCD0',
    petalShadow: '#D88AA0',
    center: '#F6E1A4',
    stamen: '#E8C878',
    leaf: '#7ECAA7',
    leafHighlight: '#98DEC0',
    stem: '#5AA384',
    glow: 'rgba(255,214,170,0.25)',
    shadow: 'rgba(0,0,0,0.12)',
    dewdrop: 'rgba(180,230,255,0.55)',
    potBody: '#C49870',
    potRim: '#D4A880',
    potShadow: '#9A7858',
    soilDark: '#8A7458',
    soilLight: '#A08A6C',
    vibrancy: 0.78,
  },
  excellent: {
    petal: '#F7A5C4',
    petalHighlight: '#FFD0E0',
    petalShadow: '#E088A8',
    center: '#FFF0B0',
    stamen: '#F0D080',
    leaf: '#76D3B1',
    leafHighlight: '#92E8CA',
    stem: '#4EA98C',
    glow: 'rgba(255,222,160,0.35)',
    shadow: 'rgba(0,0,0,0.10)',
    dewdrop: 'rgba(180,240,255,0.7)',
    potBody: '#D4A880',
    potRim: '#E4B890',
    potShadow: '#AA8868',
    soilDark: '#9A8468',
    soilLight: '#B09A7C',
    vibrancy: 1.0,
  },
};

export const weatherTokens: Record<
  GardenWeather,
  {
    background: string[];
    overlay: string;
    sparkle: string;
  }
> = {
  sunny: {
    background: ['#f9f4ea', '#f5e7cf', '#e8f4f0'],
    overlay: 'rgba(255,216,133,0.2)',
    sparkle: 'rgba(255,244,210,0.6)',
  },
  cloudy: {
    background: ['#f2f3f7', '#e5ecf5', '#eaf0f3'],
    overlay: 'rgba(200,210,220,0.25)',
    sparkle: 'rgba(240,244,255,0.4)',
  },
  rainy: {
    background: ['#e2e8f0', '#ccd7e6', '#d9e3ed'],
    overlay: 'rgba(140,160,180,0.3)',
    sparkle: 'rgba(210,225,240,0.35)',
  },
  stormy: {
    background: ['#d8dde5', '#bac7d6', '#cfd8e3'],
    overlay: 'rgba(90,110,130,0.35)',
    sparkle: 'rgba(200,210,230,0.25)',
  },
  glowy: {
    background: ['#f7eef8', '#e7f3fb', '#e8f8f1'],
    overlay: 'rgba(200,180,255,0.25)',
    sparkle: 'rgba(255,240,250,0.7)',
  },
};
