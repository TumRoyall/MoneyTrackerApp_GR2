import { SyncPullResponse, SyncPushRequest, SyncPushResponse } from '@/modules/sync/models/sync.types';

export interface SyncRemoteDataSource {
  pull(cursor: number, limit?: number): Promise<SyncPullResponse>;
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
}
