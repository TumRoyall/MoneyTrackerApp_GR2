import { StreakData, RecordActivityResponse } from '@/modules/streak/models/streak.types';

export interface StreakRemoteDataSource {
  getStreak(): Promise<StreakData>;
  recordActivity(): Promise<RecordActivityResponse>;
}
