import { initDatabase } from '@/core/db';
import { deviceStorage } from '@/core/storage/deviceStorage';
import { SyncRemoteDataSource } from '@/modules/sync/api/syncRemoteDataSource';
import { OutboxStore } from '@/modules/sync/local/outboxStore';
import { SyncStateStore } from '@/modules/sync/local/syncStateStore';
import {
  SyncOperation,
  SyncOperationResult,
  SyncPullResponse,
  SyncPushRequest,
} from '@/modules/sync/models/sync.types';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';

const CURSOR_KEY = 'lastCursor';

export class SyncService {
  private initialized = false;

  constructor(
    private readonly remote: SyncRemoteDataSource,
    private readonly outboxStore: OutboxStore,
    private readonly syncStateStore: SyncStateStore,
    private readonly walletLocal: WalletLocalDataSource,
    private readonly categoryLocal: CategoryLocalDataSource,
    private readonly transactionLocal: TransactionLocalDataSource,
  ) {}

  async ensureInitialized() {
    if (this.initialized) {
      return;
    }
    await initDatabase();
    await deviceStorage.ensureDeviceId();
    this.initialized = true;
  }

  async enqueueOperation(op: Omit<SyncOperation, 'outboxId'>) {
    await this.ensureInitialized();
    const deviceId = await deviceStorage.ensureDeviceId();
    const requestId = op.requestId;

    await this.outboxStore.enqueueOrReplace({
      requestId,
      deviceId,
      entity: op.entity,
      entityId: op.entityId,
      op: op.op,
      baseVersion: op.baseVersion ?? null,
      dataJson: op.data ? JSON.stringify(op.data) : null,
      createdAt: new Date().toISOString(),
    });
  }

  async syncOnce() {
    await this.ensureInitialized();
    await this.pushOutbox();
    await this.pullChanges();
  }

  async syncInBackground() {
    try {
      await this.syncOnce();
    } catch {
      // ignore sync errors for background attempts
    }
  }

  async pushOutbox() {
    const pending = await this.outboxStore.getPending(100);
    if (!pending.length) {
      return;
    }
    
    console.log('PUSHING OUTBOX ITEMS:', pending.map(p => ({ id: p.outboxId, entity: p.entity, op: p.op, status: p.status })));

    const deviceId = await deviceStorage.ensureDeviceId();
    const operations: SyncOperation[] = pending.map((item) => ({
      outboxId: item.outboxId,
      requestId: item.requestId,
      entity: item.entity as SyncOperation['entity'],
      entityId: item.entityId,
      op: item.op as SyncOperation['op'],
      baseVersion: item.baseVersion ?? undefined,
      data: item.dataJson ? JSON.parse(item.dataJson) : undefined,
    }));

    const request: SyncPushRequest = {
      deviceId,
      clientTime: Date.now(),
      operations,
    };

    const response = await this.remote.push(request);
    await this.handlePushResults(response.results);
  }

  private async handlePushResults(results: SyncOperationResult[]) {
    for (const result of results) {
      if (result.status === 'ok') {
        await this.outboxStore.markOk(result.outboxId);
        continue;
      }
      if (result.status === 'conflict') {
        console.error('SYNC CONFLICT:', result);
        await this.outboxStore.markConflict(
          result.outboxId,
          result.serverVersion ?? null,
          result.serverData ? JSON.stringify(result.serverData) : null,
        );
        continue;
      }
      console.error('SYNC ERROR:', result);
      await this.outboxStore.markError(result.outboxId, result.error ?? null);
    }
  }

  async pullChanges() {
    const cursorValue = await this.syncStateStore.getValue(CURSOR_KEY);
    let cursor = cursorValue ? Number(cursorValue) : 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.remote.pull(cursor, 500);
      await this.applyPull(response);
      cursor = response.nextCursor ?? cursor;
      hasMore = response.hasMore;
    }

    await this.syncStateStore.setValue(CURSOR_KEY, String(cursor));
  }

  private async applyPull(response: SyncPullResponse) {
    await this.applyDeletes(response.deletes ?? {});
    await this.applyChanges(response.changes ?? {});
  }

  private async applyDeletes(deletes: Record<string, string[]>) {
    const now = new Date().toISOString();
    const walletDeletes = deletes.wallets ?? [];
    const categoryDeletes = deletes.categories ?? [];
    const transactionDeletes = deletes.transactions ?? [];

    for (const walletId of walletDeletes) {
      await this.walletLocal.markDeleted(walletId, now);
    }
    for (const categoryId of categoryDeletes) {
      await this.categoryLocal.markDeleted(categoryId, now);
    }
    for (const transactionId of transactionDeletes) {
      await this.transactionLocal.markDeleted(transactionId, now);
    }
  }

  private async applyChanges(changes: Record<string, unknown[]>) {
    const walletChanges = (changes.wallets ?? []) as Array<Record<string, unknown>>;
    const categoryChanges = (changes.categories ?? []) as Array<Record<string, unknown>>;
    const transactionChanges = (changes.transactions ?? []) as Array<Record<string, unknown>>;

    for (const wallet of walletChanges) {
      await this.walletLocal.upsert({
        walletId: String(wallet.walletId),
        name: String(wallet.name ?? ''),
        type: String(wallet.type ?? 'REGULAR'),
        currency: String(wallet.currency ?? 'VND'),
        openingBalance: Number(wallet.openingBalance ?? 0),
        currentBalance: Number(wallet.currentBalance ?? 0),
        description: wallet.description ? String(wallet.description) : null,
        createdAt: String(wallet.createdAt ?? new Date().toISOString()),
        updatedAt: wallet.updatedAt ? String(wallet.updatedAt) : null,
        deletedAt: wallet.deletedAt ? String(wallet.deletedAt) : null,
        version: wallet.version != null ? Number(wallet.version) : 1,
      });
    }

    for (const category of categoryChanges) {
      await this.categoryLocal.upsert({
        categoryId: String(category.categoryId),
        name: String(category.name ?? ''),
        type: String(category.type ?? 'EXPENSE'),
        icon: category.icon ? String(category.icon) : null,
        color: category.color ? String(category.color) : null,
        isDefault: Boolean(category.isDefault),
        isHidden: Boolean(category.isHidden),
        createdAt: String(category.createdAt ?? new Date().toISOString()),
        updatedAt: category.updatedAt ? String(category.updatedAt) : null,
        deletedAt: category.deletedAt ? String(category.deletedAt) : null,
        version: category.version != null ? Number(category.version) : 1,
      });
    }

    for (const tx of transactionChanges) {
      await this.transactionLocal.upsert({
        transactionId: String(tx.transactionId),
        walletId: String(tx.walletId),
        categoryId: String(tx.categoryId),
        amount: Number(tx.amount ?? 0),
        type: String(tx.type ?? 'EXPENSE'),
        note: tx.note ? String(tx.note) : null,
        date: String(tx.txDate ?? tx.date ?? ''),
        createdAt: String(tx.createdAt ?? new Date().toISOString()),
        updatedAt: tx.updatedAt ? String(tx.updatedAt) : null,
        deletedAt: tx.deletedAt ? String(tx.deletedAt) : null,
        version: tx.version != null ? Number(tx.version) : 1,
      });
    }
  }
}
