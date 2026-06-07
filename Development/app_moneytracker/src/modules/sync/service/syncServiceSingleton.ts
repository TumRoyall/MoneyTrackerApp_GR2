import { SyncRemoteDataSourceImpl } from '@/modules/sync/api/syncRemoteDataSourceImpl';
import { OutboxStore } from '@/modules/sync/local/outboxStore';
import { SyncStateStore } from '@/modules/sync/local/syncStateStore';
import { SyncService } from '@/modules/sync/service/syncService';
import { WalletLocalDataSource } from '@/modules/wallet/local/walletLocalDataSource';
import { TransactionLocalDataSource } from '@/modules/transaction/local/transactionLocalDataSource';

export const syncService = new SyncService(
  new SyncRemoteDataSourceImpl(),
  new OutboxStore(),
  new SyncStateStore(),
  new WalletLocalDataSource(),
  new TransactionLocalDataSource(),
);
