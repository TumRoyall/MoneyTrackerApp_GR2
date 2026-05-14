export type GardenStage =
  | 'Seed'
  | 'Sprout'
  | 'YoungPlant'
  | 'GrowingPlant'
  | 'Budding'
  | 'Blooming';

export type GardenQuality = 'terrible' | 'poor' | 'average' | 'good' | 'excellent';

export type GardenWeather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'glowy';

export type GardenRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Expanded weather states for the V2 visual system */
export type GardenWeatherV2 =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'mist'
  | 'windy'
  | 'night'
  | 'snowfall'
  | 'sunset'
  | 'morning';

/** Season type for the visual atmosphere system */
export type GardenSeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export interface GardenSeed {
  seedId: string;
  name: string;
  rarity: GardenRarity;
  description: string;
  previewColors: {
    petal: string;
    center: string;
    leaf: string;
  };
}

export interface GardenTask {
  taskId: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
}

export interface GardenReward {
  rewardId: string;
  title: string;
  description: string;
  earnedAt: string;
  badgeColor: string;
}

export interface GardenScore {
  value: number;
  label: string;
}

export interface GardenFlowerState {
  stage: GardenStage;
  quality: GardenQuality;
  progress: number;
}

export interface GardenCurrentState {
  month: string;
  seed?: GardenSeed | null;
  score: GardenScore;
  weather: GardenWeather;
  flower: GardenFlowerState;
  dailyStreak: number;
  tasksCompletedToday: number;
  tasksTotalToday: number;
  encouragement: string;
  rewards: GardenReward[];
}

export interface GardenHistoryItem {
  month: string;
  year: number;
  seed: GardenSeed;
  score: GardenScore;
  flower: GardenFlowerState;
  completedAt: string;
}

export interface GardenMonthlyReport {
  month: string;
  year: number;
  seed: GardenSeed;
  finalScore: GardenScore;
  savingsRate: number;
  spendingChange: number;
  achievements: string[];
  replay: Array<{
    stage: GardenStage;
    quality: GardenQuality;
    day: number;
  }>;
}

export interface GardenFlowerSelectionInput {
  seedId: string;
}

export interface GardenTaskCompletionInput {
  taskId: string;
}
