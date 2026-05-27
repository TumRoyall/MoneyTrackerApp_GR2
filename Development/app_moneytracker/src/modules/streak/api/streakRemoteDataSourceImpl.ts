import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { StreakData, RecordActivityResponse } from '@/modules/streak/models/streak.types';
import { StreakRemoteDataSource } from '@/modules/streak/api/streakRemoteDataSource';

export class StreakRemoteDataSourceImpl implements StreakRemoteDataSource {
  async getStreak(): Promise<StreakData> {
    const response = await httpClient.get<ApiResponse<StreakData>>('/api/streaks');
    return response.data.data;
  }

  async recordActivity(): Promise<RecordActivityResponse> {
    const response = await httpClient.post<ApiResponse<RecordActivityResponse>>('/api/streaks/activity');
    return response.data.data;
  }
}
