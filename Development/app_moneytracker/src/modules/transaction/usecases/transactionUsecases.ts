import {
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput,
} from '@/modules/transaction/models/transaction.types';
import { TransactionRepository } from '@/modules/transaction/repository/transactionRepository';

export const createTransactionUsecases = (repository: TransactionRepository) => ({
  getTransactions: (filters?: TransactionFilters) => repository.getTransactions(filters),
  getTransaction: (transactionId: string) => repository.getTransaction(transactionId),
  createTransaction: (payload: TransactionCreateInput) => repository.createTransaction(payload),
  updateTransaction: (transactionId: string, payload: TransactionUpdateInput) =>
    repository.updateTransaction(transactionId, payload),
  deleteTransaction: (transactionId: string) => repository.deleteTransaction(transactionId),
});