import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import {
  PageResponse,
  Transaction,
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput,
} from '@/modules/transaction/models/transaction.types';
import { TransactionRemoteDataSource } from '@/modules/transaction/api/transactionRemoteDataSource';

export class TransactionRemoteDataSourceImpl implements TransactionRemoteDataSource {
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await httpClient.get<ApiResponse<PageResponse<Transaction> | Transaction[]>>(
      '/api/transactions',
      { params: filters },
    );

    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data.content ?? [];
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    const response = await httpClient.get<ApiResponse<Transaction>>(`/api/transactions/${transactionId}`);
    return response.data.data;
  }

  async createTransaction(payload: TransactionCreateInput): Promise<Transaction> {
    const response = await httpClient.post<ApiResponse<Transaction>>('/api/transactions', payload);
    return response.data.data;
  }

  async updateTransaction(transactionId: string, payload: TransactionUpdateInput): Promise<Transaction> {
    const response = await httpClient.put<ApiResponse<Transaction>>(`/api/transactions/${transactionId}`, payload);
    return response.data.data;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await httpClient.delete(`/api/transactions/${transactionId}`);
  }
}