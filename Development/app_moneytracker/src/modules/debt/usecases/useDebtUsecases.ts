import { useMemo } from 'react';

import { DebtRemoteDataSourceImpl } from '@/modules/debt/api/debtRemoteDataSourceImpl';
import { DebtRepositoryImpl } from '@/modules/debt/repository/debtRepositoryImpl';
import { createDebtUsecases } from '@/modules/debt/usecases/debtUsecases';

export const useDebtUsecases = () => {
  const repository = useMemo(() => new DebtRepositoryImpl(new DebtRemoteDataSourceImpl()), []);

  return useMemo(() => createDebtUsecases(repository), [repository]);
};
