import { useMemo } from 'react';

import { BudgetRemoteDataSourceImpl } from '@/modules/budget/api/budgetRemoteDataSourceImpl';
import { BudgetRepositoryImpl } from '@/modules/budget/repository/budgetRepositoryImpl';
import { createBudgetUsecases } from '@/modules/budget/usecases/budgetUsecases';

export const useBudgetUsecases = () => {
  const repository = useMemo(
    () => new BudgetRepositoryImpl(new BudgetRemoteDataSourceImpl()),
    [],
  );

  return useMemo(() => createBudgetUsecases(repository), [repository]);
};
