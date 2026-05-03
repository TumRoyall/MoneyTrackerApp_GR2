import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { Wallet, WalletCreateInput, WalletUpdateInput } from '@/modules/wallet/models/wallet.types';
import { WalletRemoteDataSource } from '@/modules/wallet/api/walletRemoteDataSource';

export class WalletRemoteDataSourceImpl implements WalletRemoteDataSource {
  async getWallets(): Promise<Wallet[]> {
    const response = await httpClient.get<ApiResponse<Wallet[]>>('/api/wallets');
    return response.data.data;
  }

  async createWallet(payload: WalletCreateInput): Promise<Wallet> {
    const response = await httpClient.post<ApiResponse<Wallet>>('/api/wallets', payload);
    return response.data.data;
  }

  async updateWallet(walletId: string, payload: WalletUpdateInput): Promise<Wallet> {
    const response = await httpClient.put<ApiResponse<Wallet>>(`/api/wallets/${walletId}`, payload);
    return response.data.data;
  }

  async deleteWallet(walletId: string): Promise<void> {
    await httpClient.delete(`/api/wallets/${walletId}`);
  }
}