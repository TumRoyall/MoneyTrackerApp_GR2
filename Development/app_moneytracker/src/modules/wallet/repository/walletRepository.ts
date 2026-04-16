import { Wallet, WalletCreateInput } from '@/modules/wallet/models/wallet.types';

export interface WalletRepository {
  getWallets(): Promise<Wallet[]>;
  createWallet(payload: WalletCreateInput): Promise<Wallet>;
}
