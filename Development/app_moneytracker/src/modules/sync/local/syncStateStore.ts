import { executeSql, queryOne } from '@/core/db/sqlite';

export class SyncStateStore {
  async getValue(key: string) {
    const row = await queryOne<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  async setValue(key: string, value: string) {
    await executeSql(
      'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }
}
