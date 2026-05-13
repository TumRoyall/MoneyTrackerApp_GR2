import { GardenQuality, GardenWeather } from '@/modules/garden/models/garden.types';

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
