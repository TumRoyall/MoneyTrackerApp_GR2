import { StreakData, RecordActivityResponse } from '@/modules/streak/models/streak.types';

export interface StreakRepository {
  getStreak(): Promise<StreakData>;
  recordActivity(): Promise<RecordActivityResponse>;
}
