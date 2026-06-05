import * as Crypto from 'expo-crypto';
import { executeBatch, executeSql, queryOne } from '@/core/db/sqlite';
import { defaultCategories } from '@/modules/category/data/defaultCategories';

type Migration = {
  version: number;
  statements: { sql: string; params?: (string | number | null)[] }[];
};

const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      {
        sql: `CREATE TABLE IF NOT EXISTS wallets (
          walletId TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          currency TEXT NOT NULL,
          openingBalance REAL NOT NULL DEFAULT 0,
          currentBalance REAL NOT NULL DEFAULT 0,
          description TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1
        );`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS categories (
          categoryId TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          isDefault INTEGER NOT NULL DEFAULT 0,
          isHidden INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1
        );`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS transactions (
          transactionId TEXT PRIMARY KEY,
          walletId TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1
        );`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS outbox (
          outboxId INTEGER PRIMARY KEY AUTOINCREMENT,
          requestId TEXT NOT NULL,
          deviceId TEXT NOT NULL,
          entity TEXT NOT NULL,
          entityId TEXT NOT NULL,
          op TEXT NOT NULL,
          baseVersion INTEGER,
          dataJson TEXT,
          status TEXT DEFAULT 'pending',
          serverVersion INTEGER,
          serverDataJson TEXT,
          error TEXT,
          createdAt TEXT NOT NULL
        );`,
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS sync_state (
          key TEXT PRIMARY KEY,
          value TEXT
        );`,
      },
    ],
  },
];

const getUserVersion = async () => {
  const row = await queryOne<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
};

const setUserVersion = async (version: number) => {
  await executeSql(`PRAGMA user_version = ${version}`);
};

const seedDefaultCategories = async () => {
  const now = new Date().toISOString();

  for (const cat of defaultCategories) {
    const categoryId = Crypto.randomUUID();

    await executeSql(
      `INSERT OR REPLACE INTO categories
       (categoryId, name, type, icon, color, isDefault, isHidden, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [categoryId, cat.name, cat.type, cat.icon, cat.color, now, now]
    );
  }
};

export const runMigrations = async () => {
  const currentVersion = await getUserVersion();
  const pending = migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await executeBatch(migration.statements);
    await setUserVersion(migration.version);

    // Seed default categories after migration v1 (which creates categories table)
    if (migration.version === 1) {
      await seedDefaultCategories();
    }
  }
};
