import { useMemo } from 'react';

import { StreakRemoteDataSourceImpl } from '@/modules/streak/api/streakRemoteDataSourceImpl';
import { StreakRepositoryImpl } from '@/modules/streak/repository/streakRepositoryImpl';
import { createStreakUsecases } from '@/modules/streak/usecases/streakUsecases';

export const useStreakUsecases = () => {
  const repository = useMemo(
    () => new StreakRepositoryImpl(new StreakRemoteDataSourceImpl()),
    [],
  );
  return useMemo(() => createStreakUsecases(repository), [repository]);
};
