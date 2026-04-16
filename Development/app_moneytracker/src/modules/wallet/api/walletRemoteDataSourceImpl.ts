import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { Wallet, WalletCreateInput } from '@/modules/wallet/models/wallet.types';
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
}