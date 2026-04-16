import { useMemo } from 'react';

import { CategoryRemoteDataSourceImpl } from '@/modules/category/api/categoryRemoteDataSourceImpl';
import { CategoryRepositoryImpl } from '@/modules/category/repository/categoryRepositoryImpl';
import { createCategoryUsecases } from '@/modules/category/usecases/categoryUsecases';

export const useCategoryUsecases = () => {
  const repository = useMemo(
    () => new CategoryRepositoryImpl(new CategoryRemoteDataSourceImpl()),
    [],
  );
  return useMemo(() => createCategoryUsecases(repository), [repository]);
};