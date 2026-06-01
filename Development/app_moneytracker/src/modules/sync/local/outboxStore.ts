import { executeSql, queryAll, queryOne } from '@/core/db/sqlite';

export type OutboxRow = {
  outboxId: number;
  requestId: string;
  deviceId: string;
  entity: string;
  entityId: string;
  op: string;
  baseVersion?: number | null;
  dataJson?: string | null;
  status?: string | null;
  serverVersion?: number | null;
  serverDataJson?: string | null;
  error?: string | null;
  createdAt: string;
};

export class OutboxStore {
  async getPending(limit = 50) {
    return queryAll<OutboxRow>(
      'SELECT * FROM outbox WHERE status IN (?, ?) ORDER BY outboxId ASC LIMIT ?',
      ['pending', 'error', limit],
    );
  }

  async enqueueOrReplace(params: {
    requestId: string;
    deviceId: string;
    entity: string;
    entityId: string;
    op: string;
    baseVersion?: number | null;
    dataJson?: string | null;
    createdAt: string;
  }) {
    const existing = await queryOne<OutboxRow>(
      'SELECT * FROM outbox WHERE entity = ? AND entityId = ? AND status = ? ORDER BY outboxId DESC LIMIT 1',
      [params.entity, params.entityId, 'pending'],
    );

    if (existing) {
      await executeSql(
        'UPDATE outbox SET op = ?, dataJson = ?, error = NULL, serverDataJson = NULL, serverVersion = NULL WHERE outboxId = ?',
        [params.op, params.dataJson ?? null, existing.outboxId],
      );
      return existing.outboxId;
    }

    const result = await executeSql(
      `INSERT INTO outbox (requestId, deviceId, entity, entityId, op, baseVersion, dataJson, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        params.requestId,
        params.deviceId,
        params.entity,
        params.entityId,
        params.op,
        params.baseVersion ?? null,
        params.dataJson ?? null,
        params.createdAt,
      ],
    );

    return result.insertId ?? null;
  }

  async markOk(outboxId: number) {
    await executeSql('DELETE FROM outbox WHERE outboxId = ?', [outboxId]);
  }

  async markConflict(outboxId: number, serverVersion: number | null, serverDataJson: string | null) {
    await executeSql(
      'UPDATE outbox SET status = ?, serverVersion = ?, serverDataJson = ? WHERE outboxId = ?',
      ['conflict', serverVersion, serverDataJson, outboxId],
    );
  }

  async markError(outboxId: number, error: string | null) {
    await executeSql(
      'UPDATE outbox SET status = ?, error = ? WHERE outboxId = ?',
      ['error', error, outboxId],
    );
  }
}
