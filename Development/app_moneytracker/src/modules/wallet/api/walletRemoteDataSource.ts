import { Wallet, WalletCreateInput } from '@/modules/wallet/models/wallet.types';

export interface WalletRemoteDataSource {
  getWallets(): Promise<Wallet[]>;
  createWallet(payload: WalletCreateInput): Promise<Wallet>;
}
