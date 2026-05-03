import { Wallet, WalletCreateInput, WalletUpdateInput } from '@/modules/wallet/models/wallet.types';

export interface WalletRemoteDataSource {
  getWallets(): Promise<Wallet[]>;
  createWallet(payload: WalletCreateInput): Promise<Wallet>;
  updateWallet(walletId: string, payload: WalletUpdateInput): Promise<Wallet>;
  deleteWallet(walletId: string): Promise<void>;
}
