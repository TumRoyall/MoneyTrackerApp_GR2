import { Wallet } from '@/modules/wallet/models/wallet.types';

export interface WalletRemoteDataSource {
  getWallets(): Promise<Wallet[]>;
}
