import { Wallet } from '@/modules/wallet/models/wallet.types';

export interface WalletRepository {
  getWallets(): Promise<Wallet[]>;
}
