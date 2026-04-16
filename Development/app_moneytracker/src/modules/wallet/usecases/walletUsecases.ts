import { WalletCreateInput } from '@/modules/wallet/models/wallet.types';
import { WalletRepository } from '@/modules/wallet/repository/walletRepository';

export const createWalletUsecases = (repository: WalletRepository) => ({
  getWallets: () => repository.getWallets(),
  createWallet: (payload: WalletCreateInput) => repository.createWallet(payload),
});