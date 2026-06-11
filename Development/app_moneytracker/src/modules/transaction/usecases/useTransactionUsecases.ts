import { useMemo } from 'react';

import { TransactionRemoteDataSourceImpl } from '@/modules/transaction/api/transactionRemoteDataSourceImpl';
import { TransactionRepositoryLocalFirst } from '@/modules/transaction/repository/transactionRepositoryLocalFirst';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';
import { createTransactionUsecases } from '@/modules/transaction/usecases/transactionUsecases';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

export const useTransactionUsecases = () => {
  const repository = useMemo(
    () => new TransactionRepositoryLocalFirst(
      new TransactionLocalDataSource(),
      new TransactionRemoteDataSourceImpl(),
      new WalletLocalDataSource(),
      syncService,
    ),
    [],
  );
  return useMemo(() => createTransactionUsecases(repository), [repository]);
};