import * as Crypto from 'expo-crypto';
import {
  Transaction,
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput,
} from '@/modules/transaction/models/transaction.types';
import { TransactionRepository } from '@/modules/transaction/repository/transactionRepository';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';
import { TransactionRemoteDataSource } from '@/modules/transaction/api/transactionRemoteDataSource';
import { SyncService } from '@/modules/sync/service/syncService';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';

const signedAmount = (amount: number, type: string) => (type === 'INCOME' ? amount : -amount);

export class TransactionRepositoryLocalFirst implements TransactionRepository {
  constructor(
    private readonly local: TransactionLocalDataSource,
    private readonly remote: TransactionRemoteDataSource,
    private readonly walletLocal: WalletLocalDataSource,
    private readonly syncService: SyncService,
  ) {}

  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    await this.syncService.ensureInitialized();
    const localData = await this.local.getTransactions(filters);
    if (localData.length) {
      return localData;
    }

    try {
      const remoteData = await this.remote.getTransactions(filters);
      await this.local.upsertMany(remoteData);
      return remoteData;
    } catch {
      return localData;
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    await this.syncService.ensureInitialized();
    const localTx = await this.local.getTransactionById(transactionId);
    if (localTx) {
      return localTx;
    }

    try {
      const remoteTx = await this.remote.getTransaction(transactionId);
      if (remoteTx) {
        await this.local.upsert(remoteTx);
      }
      return remoteTx;
    } catch {
      return localTx;
    }
  }

  async createTransaction(payload: TransactionCreateInput): Promise<Transaction> {
    await this.syncService.ensureInitialized();
    const now = new Date().toISOString();
    const type = payload.type ?? 'EXPENSE';

    const tx: Transaction = {
      transactionId: Crypto.randomUUID(),
      walletId: payload.walletId,
      categoryId: payload.categoryId,
      amount: payload.amount,
      type,
      note: payload.note ?? null,
      date: payload.date,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    };

    await this.local.upsert(tx);
    await this.updateWalletBalance(tx.walletId, signedAmount(tx.amount, type));

    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'transactions',
      entityId: tx.transactionId,
      op: 'UPSERT',
      baseVersion: null,
      data: {
        transactionId: tx.transactionId,
        walletId: tx.walletId,
        categoryId: tx.categoryId,
        amount: tx.amount,
        type: tx.type,
        note: tx.note,
        txDate: tx.date.split('T')[0],
        createdAt: tx.createdAt ? new Date(tx.createdAt).getTime() : undefined,
        updatedAt: tx.updatedAt ? new Date(tx.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();

    return tx;
  }

  async updateTransaction(transactionId: string, payload: TransactionUpdateInput): Promise<Transaction> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getTransactionById(transactionId);
    if (!existing) {
      throw new Error('Transaction not found');
    }

    const nextType = payload.type ?? existing.type ?? 'EXPENSE';

    const updated: Transaction = {
      ...existing,
      categoryId: payload.categoryId ?? existing.categoryId,
      amount: payload.amount ?? existing.amount,
      type: nextType,
      note: payload.note ?? existing.note,
      date: payload.date ?? existing.date,
      updatedAt: new Date().toISOString(),
    };

    await this.local.upsert(updated);

    const oldSigned = signedAmount(existing.amount, existing.type ?? 'EXPENSE');
    const newSigned = signedAmount(updated.amount, updated.type ?? 'EXPENSE');
    await this.updateWalletBalance(updated.walletId, newSigned - oldSigned);

    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'transactions',
      entityId: transactionId,
      op: 'UPSERT',
      baseVersion: existing.version ?? 1,
      data: {
        transactionId: updated.transactionId,
        walletId: updated.walletId,
        categoryId: updated.categoryId,
        amount: updated.amount,
        type: updated.type,
        note: updated.note,
        txDate: updated.date.split('T')[0],
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();

    return updated;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getTransactionById(transactionId);
    if (!existing) {
      return;
    }

    const deletedAt = new Date().toISOString();
    await this.local.markDeleted(transactionId, deletedAt);
    await this.updateWalletBalance(
      existing.walletId,
      -signedAmount(existing.amount, existing.type ?? 'EXPENSE'),
    );

    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'transactions',
      entityId: transactionId,
      op: 'DELETE',
      baseVersion: existing.version ?? 1,
      deletedAt: Date.now(),
    });

    void this.syncService.syncInBackground();
  }

  private async updateWalletBalance(walletId: string, delta: number) {
    const wallet = await this.walletLocal.getWalletById(walletId);
    if (!wallet) {
      return;
    }
    const nextBalance = (wallet.currentBalance ?? 0) + delta;
    await this.walletLocal.upsert({
      ...wallet,
      currentBalance: nextBalance,
      updatedAt: new Date().toISOString(),
    });
  }
}
