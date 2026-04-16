import { useMemo } from 'react';

import { WalletRemoteDataSourceImpl } from '@/modules/wallet/api/walletRemoteDataSourceImpl';
import { WalletRepositoryImpl } from '@/modules/wallet/repository/walletRepositoryImpl';
import { createWalletUsecases } from '@/modules/wallet/usecases/walletUsecases';

export const useWalletUsecases = () => {
  const repository = useMemo(() => new WalletRepositoryImpl(new WalletRemoteDataSourceImpl()), []);
  return useMemo(() => createWalletUsecases(repository), [repository]);
};