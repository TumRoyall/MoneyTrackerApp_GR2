/**
 * SeasonManager — Determines the current season based on calendar month.
 * Provides season-specific visual configurations for the garden.
 */

export type GardenSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonConfig {
  season: GardenSeason;
  /** Ambient light warmth multiplier (0.0 = cool blue, 1.0 = warm gold) */
  warmth: number;
  /** Wind base strength (0.0–1.0) */
  windBase: number;
  /** Particle density multiplier */
  particleDensity: number;
  /** Whether falling particles are active (leaves in autumn, snow in winter) */
  fallingParticles: boolean;
  /** Whether pollen/floating particles are active */
  floatingParticles: boolean;
  /** Color accent for the season's ambient tint */
  ambientTint: string;
}

const SEASON_CONFIGS: Record<GardenSeason, Omit<SeasonConfig, 'season'>> = {
  spring: {
    warmth: 0.55,
    windBase: 0.3,
    particleDensity: 1.0,
    fallingParticles: false,
    floatingParticles: true,
    ambientTint: 'rgba(255, 240, 220, 0.12)',
  },
  summer: {
    warmth: 0.8,
    windBase: 0.15,
    particleDensity: 0.7,
    fallingParticles: false,
    floatingParticles: true,
    ambientTint: 'rgba(255, 248, 220, 0.18)',
  },
  autumn: {
    warmth: 0.65,
    windBase: 0.5,
    particleDensity: 1.2,
    fallingParticles: true,
    floatingParticles: false,
    ambientTint: 'rgba(255, 220, 180, 0.15)',
  },
  winter: {
    warmth: 0.25,
    windBase: 0.35,
    particleDensity: 0.9,
    fallingParticles: true,
    floatingParticles: false,
    ambientTint: 'rgba(220, 235, 255, 0.14)',
  },
};

/**
 * Maps a month (1-12) to a season.
 * Northern hemisphere convention: Mar-May = spring, Jun-Aug = summer, etc.
 */
const monthToSeason = (month: number): GardenSeason => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

/**
 * Get the current season configuration.
 * @param overrideSeason - Optional override for testing/dev purposes.
 */
export const getSeasonConfig = (overrideSeason?: GardenSeason): SeasonConfig => {
  const season = overrideSeason ?? monthToSeason(new Date().getMonth() + 1);
  return { season, ...SEASON_CONFIGS[season] };
};

/**
 * Get just the current season name.
 */
export const getCurrentSeason = (): GardenSeason => {
  return monthToSeason(new Date().getMonth() + 1);
};
