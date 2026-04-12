import {
  Transaction,
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput,
} from '@/modules/transaction/models/transaction.types';

export interface TransactionRemoteDataSource {
  getTransactions(filters?: TransactionFilters): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<Transaction | null>;
  createTransaction(payload: TransactionCreateInput): Promise<Transaction>;
  updateTransaction(transactionId: string, payload: TransactionUpdateInput): Promise<Transaction>;
  deleteTransaction(transactionId: string): Promise<void>;
}
