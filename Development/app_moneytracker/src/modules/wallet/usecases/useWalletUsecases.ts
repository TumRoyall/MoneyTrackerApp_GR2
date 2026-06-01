import { useMemo } from 'react';

import { WalletRemoteDataSourceImpl } from '@/modules/wallet/api/walletRemoteDataSourceImpl';
import { WalletRepositoryLocalFirst } from '@/modules/wallet/repository/walletRepositoryLocalFirst';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { createWalletUsecases } from '@/modules/wallet/usecases/walletUsecases';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

export const useWalletUsecases = () => {
  const repository = useMemo(
    () => new WalletRepositoryLocalFirst(
      new WalletLocalDataSource(),
      new WalletRemoteDataSourceImpl(),
      syncService,
    ),
    [],
  );
  return useMemo(() => createWalletUsecases(repository), [repository]);
};