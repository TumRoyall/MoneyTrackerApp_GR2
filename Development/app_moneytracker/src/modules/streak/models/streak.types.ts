export type AchievementType =
  | 'LONGEST_STREAK'
  | 'PERFECT_WEEK'
  | 'PERFECT_MONTH'
  | 'BUDGET_GUARDIAN'
  | 'TREASURE_KEEPER'
  | 'DEBT_CRUSHER';

export interface Achievement {
  achievementId: string;
  type: AchievementType;
  level: number;
  achievedAt: string;
  title: string;
  description?: string;
  icon: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakStartDate: string | null;
  resetHours: number;
  totalActiveDays: number;
  activeDates: string[];
  achievements: Achievement[];
}

export interface RecordActivityResponse {
  updated: boolean;
  currentStreak: number;
  isNewDay: boolean;
  newAchievements: Achievement[];
}
