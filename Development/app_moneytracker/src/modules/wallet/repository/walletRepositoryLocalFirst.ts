import * as Crypto from 'expo-crypto';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { WalletRemoteDataSource } from '@/modules/wallet/api/walletRemoteDataSource';
import { Wallet, WalletCreateInput, WalletUpdateInput } from '@/modules/wallet/models/wallet.types';
import { WalletRepository } from '@/modules/wallet/repository/walletRepository';
import { SyncService } from '@/modules/sync/service/syncService';

export class WalletRepositoryLocalFirst implements WalletRepository {
  constructor(
    private readonly local: WalletLocalDataSource,
    private readonly remote: WalletRemoteDataSource,
    private readonly syncService: SyncService,
  ) {}

  async getWallets(): Promise<Wallet[]> {
    await this.syncService.ensureInitialized();
    const localWallets = await this.local.getWallets();
    if (localWallets.length) {
      return localWallets;
    }

    try {
      const remoteWallets = await this.remote.getWallets();
      await this.local.upsertMany(remoteWallets);
      return remoteWallets;
    } catch {
      return localWallets;
    }
  }

  async createWallet(payload: WalletCreateInput): Promise<Wallet> {
    await this.syncService.ensureInitialized();
    const now = new Date().toISOString();
    const wallet: Wallet = {
      walletId: Crypto.randomUUID(),
      name: payload.name,
      type: payload.type,
      currency: payload.currency,
      openingBalance: payload.openingBalance ?? 0,
      currentBalance: payload.openingBalance ?? 0,
      description: payload.description ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    };

    await this.local.upsert(wallet);
    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'wallets',
      entityId: wallet.walletId,
      op: 'UPSERT',
      baseVersion: null,
      data: {
        walletId: wallet.walletId,
        name: wallet.name,
        type: wallet.type,
        currency: wallet.currency,
        openingBalance: wallet.openingBalance,
        description: wallet.description,
        createdAt: wallet.createdAt ? new Date(wallet.createdAt).getTime() : undefined,
        updatedAt: wallet.updatedAt ? new Date(wallet.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();

    return wallet;
  }

  async updateWallet(walletId: string, payload: WalletUpdateInput): Promise<Wallet> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getWalletById(walletId);
    if (!existing) {
      throw new Error('Wallet not found');
    }

    const nextOpeningBalance = payload.openingBalance ?? existing.openingBalance;
    const openingDelta = nextOpeningBalance - existing.openingBalance;

    const updated: Wallet = {
      ...existing,
      name: payload.name ?? existing.name,
      type: payload.type ?? existing.type,
      currency: payload.currency ?? existing.currency,
      openingBalance: nextOpeningBalance,
      currentBalance: (existing.currentBalance ?? 0) + openingDelta,
      updatedAt: new Date().toISOString(),
    };

    await this.local.upsert(updated);
    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'wallets',
      entityId: walletId,
      op: 'UPSERT',
      baseVersion: existing.version ?? 1,
      data: {
        walletId: updated.walletId,
        name: updated.name,
        type: updated.type,
        currency: updated.currency,
        openingBalance: updated.openingBalance,
        description: updated.description,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();

    return updated;
  }

  async deleteWallet(walletId: string): Promise<void> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getWalletById(walletId);
    if (!existing) {
      return;
    }
    const deletedAt = new Date().toISOString();
    await this.local.markDeleted(walletId, deletedAt);
    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'wallets',
      entityId: walletId,
      op: 'DELETE',
      baseVersion: existing.version ?? 1,
      deletedAt: Date.now(),
    });

    void this.syncService.syncInBackground();
  }
}
