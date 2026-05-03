import { WalletCreateInput, WalletUpdateInput } from '@/modules/wallet/models/wallet.types';
import { WalletRemoteDataSource } from '@/modules/wallet/api/walletRemoteDataSource';
import { WalletRepository } from '@/modules/wallet/repository/walletRepository';

export class WalletRepositoryImpl implements WalletRepository {
  constructor(private readonly remote: WalletRemoteDataSource) {}

  async getWallets() {
    return this.remote.getWallets();
  }

  async createWallet(payload: WalletCreateInput) {
    return this.remote.createWallet(payload);
  }

  async updateWallet(walletId: string, payload: WalletUpdateInput) {
    return this.remote.updateWallet(walletId, payload);
  }

  async deleteWallet(walletId: string) {
    return this.remote.deleteWallet(walletId);
  }
}