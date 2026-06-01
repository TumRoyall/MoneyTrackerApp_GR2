import { useMemo } from 'react';

import { CategoryRemoteDataSourceImpl } from '@/modules/category/api/categoryRemoteDataSourceImpl';
import { CategoryRepositoryLocalFirst } from '@/modules/category/repository/categoryRepositoryLocalFirst';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { createCategoryUsecases } from '@/modules/category/usecases/categoryUsecases';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

export const useCategoryUsecases = () => {
  const repository = useMemo(
    () => new CategoryRepositoryLocalFirst(
      new CategoryLocalDataSource(),
      new CategoryRemoteDataSourceImpl(),
      syncService,
    ),
    [],
  );
  return useMemo(() => createCategoryUsecases(repository), [repository]);
};