import { StreakRepository } from '@/modules/streak/repository/streakRepository';
import { StreakRemoteDataSource } from '@/modules/streak/api/streakRemoteDataSource';

export class StreakRepositoryImpl implements StreakRepository {
  constructor(private readonly remote: StreakRemoteDataSource) {}

  async getStreak() {
    return this.remote.getStreak();
  }

  async recordActivity() {
    return this.remote.recordActivity();
  }
}
