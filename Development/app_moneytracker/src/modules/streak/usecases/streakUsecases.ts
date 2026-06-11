import { StreakRepository } from '@/modules/streak/repository/streakRepository';

export const createStreakUsecases = (repository: StreakRepository) => ({
  getStreak: () => repository.getStreak(),
  recordActivity: () => repository.recordActivity(),
});
