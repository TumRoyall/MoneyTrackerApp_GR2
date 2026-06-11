import { httpClient } from '@/core/api/httpClient';
import { SyncPullResponse, SyncPushRequest, SyncPushResponse } from '@/modules/sync/models/sync.types';
import { SyncRemoteDataSource } from '@/modules/sync/api/syncRemoteDataSource';

export class SyncRemoteDataSourceImpl implements SyncRemoteDataSource {
  async pull(cursor: number, limit = 500): Promise<SyncPullResponse> {
    const response = await httpClient.get<SyncPullResponse>('/api/sync/pull', {
      params: { cursor, limit },
    });
    return response.data;
  }

  async push(request: SyncPushRequest): Promise<SyncPushResponse> {
    const response = await httpClient.post<SyncPushResponse>('/api/sync/push', request);
    return response.data;
  }
}
