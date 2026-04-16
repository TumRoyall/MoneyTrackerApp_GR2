import { useMemo } from 'react';

import { TransactionRemoteDataSourceImpl } from '@/modules/transaction/api/transactionRemoteDataSourceImpl';
import { TransactionRepositoryImpl } from '@/modules/transaction/repository/transactionRepositoryImpl';
import { createTransactionUsecases } from '@/modules/transaction/usecases/transactionUsecases';

export const useTransactionUsecases = () => {
  const repository = useMemo(
    () => new TransactionRepositoryImpl(new TransactionRemoteDataSourceImpl()),
    [],
  );
  return useMemo(() => createTransactionUsecases(repository), [repository]);
};