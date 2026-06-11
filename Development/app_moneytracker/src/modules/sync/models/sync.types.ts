export type SyncEntity = 'wallets' | 'categories' | 'transactions' | 'budgets' | 'user_profiles';
export type SyncOperationType = 'UPSERT' | 'DELETE';

export interface SyncOperation {
  outboxId: number;
  requestId: string;
  entity: SyncEntity;
  entityId: string;
  op: SyncOperationType;
  baseVersion?: number | null;
  data?: Record<string, unknown> | null;
  deletedAt?: number | null;
}

export interface SyncPushRequest {
  deviceId: string;
  clientTime: number;
  operations: SyncOperation[];
}

export interface SyncOperationResult {
  outboxId: number;
  requestId: string;
  status: 'ok' | 'conflict' | 'error';
  newVersion?: number | null;
  serverVersion?: number | null;
  serverData?: Record<string, unknown> | null;
  error?: string | null;
}

export interface SyncPushResponse {
  results: SyncOperationResult[];
}

export interface SyncPullResponse {
  nextCursor: number;
  hasMore: boolean;
  changes: Record<string, unknown[]>;
  deletes: Record<string, string[]>;
}
