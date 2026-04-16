import {
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput,
} from '@/modules/transaction/models/transaction.types';
import { TransactionRemoteDataSource } from '@/modules/transaction/api/transactionRemoteDataSource';
import { TransactionRepository } from '@/modules/transaction/repository/transactionRepository';

export class TransactionRepositoryImpl implements TransactionRepository {
  constructor(private readonly remote: TransactionRemoteDataSource) {}

  async getTransactions(filters?: TransactionFilters) {
    return this.remote.getTransactions(filters);
  }

  async getTransaction(transactionId: string) {
    return this.remote.getTransaction(transactionId);
  }

  async createTransaction(payload: TransactionCreateInput) {
    return this.remote.createTransaction(payload);
  }

  async updateTransaction(transactionId: string, payload: TransactionUpdateInput) {
    return this.remote.updateTransaction(transactionId, payload);
  }

  async deleteTransaction(transactionId: string) {
    return this.remote.deleteTransaction(transactionId);
  }
}