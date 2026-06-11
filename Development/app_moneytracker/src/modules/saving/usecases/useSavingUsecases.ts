import { useMemo } from 'react';

import { SavingRemoteDataSourceImpl } from '@/modules/saving/api/savingRemoteDataSourceImpl';
import { SavingRepositoryImpl } from '@/modules/saving/repository/savingRepositoryImpl';
import { createSavingUsecases } from '@/modules/saving/usecases/savingUsecases';

export const useSavingUsecases = () => {
  const repository = useMemo(
    () => new SavingRepositoryImpl(new SavingRemoteDataSourceImpl()),
    [],
  );

  return useMemo(() => createSavingUsecases(repository), [repository]);
};
