import * as Crypto from 'expo-crypto';
import { executeBatch, executeSql, queryOne } from '@/core/db/sqlite';
import { categoryGroups } from '@/modules/category/data/categoryIconGroups';

type Migration = {
  version: number;
  statements: { sql: string; params?: (string | number | null)[] }[];
};

// Fixed namespace for deriving deterministic default-category IDs. Must
// match the server's DefaultCategoriesSeeder.CategoryGroups.NAMESPACE so
// client and server compute the same UUID for each (groupId, icon) tuple.
const DEFAULT_CATEGORY_NAMESPACE = 'moneytracker-default-category-v3';

/**
 * Derive a deterministic UUID for a default category from (groupId, icon).
 * Uses SHA-1 (UUIDv5-style) so the same tuple always produces the same UUID
 * across app restarts AND across client/server.
 *
 * IMPORTANT: input is `(groupId, icon)` instead of just `name` to avoid
 * collisions when the same icon name (e.g. `food-drumstick`) appears in
 * multiple groups (`pet` vs `grocery`). See the comment on the seed loop
 * for the full list of such collisions.
 */
const deriveDefaultCategoryId = async (groupId: string, icon: string): Promise<string> => {
  const input = `${DEFAULT_CATEGORY_NAMESPACE}:${groupId}:${icon}`;
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    input,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  // SHA-1 is 40 hex chars. Use the first 32 hex chars (16 bytes) and format
  // as a UUID v5 (version 5 nibble + variant bits).
  const h = hashHex.slice(0, 32);
  // Set version (5) in the 13th hex digit and variant (10xx) in the 17th.
  const version = 5;
  const variantHi = 0x8; // 10xx -> top 4 bits of 17th hex = 8..b
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    bytes.push(parseInt(h.slice(i * 2, i * 2 + 2), 16));
  }
  // version field: high 4 bits of byte 6
  bytes[6] = ((bytes[6] & 0x0f) | (version << 4)) & 0xff;
  // variant field: top 2 bits of byte 8 = 10
  bytes[8] = ((bytes[8] & 0x3f) | (variantHi << 5)) & 0xff;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
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
          groupId TEXT NOT NULL DEFAULT '',
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
  {
    // Backfill the 'Tiết kiệm' default category for installs that pre-date its
    // addition to defaultCategories. The savings bucket is the one the AI
    // budget generator emits as a savings line, so existing devices need the
    // row to resolve the icon/color in the AI Budget Preview.
    version: 2,
    statements: [],
  },
  {
    // Cleanup: previous builds used randomUUID() when seeding default
    // categories, so restarting the app created fresh rows each time and left
    // duplicates. v3 triggers a re-seed using deterministic IDs (UUIDv5-style)
    // and deletes any pre-existing default rows whose name is in the current
    // default list. After this migration runs once, default categories have
    // stable IDs.
    //
    // We do NOT enqueue default categories to the outbox here: defaults are
    // server-managed system data returned via /api/sync/pull, not pushed
    // from the client. Pushing them caused the server to reject subsequent
    // updates with "Default category cannot be modified".
    version: 3,
    statements: [
      {
        sql: "DELETE FROM outbox WHERE entity = 'categories'",
      },
    ]
  },
  {
    // Hardcode system categories from categoryIconGroups and drop all
    // local transactions. This is a one-time reset:
    //   - Categories are no longer synced. Client + server both seed the
    //     same rows with deterministic UUIDs derived from (groupId, icon)
    //     using namespace 'moneytracker-default-category-v3'.
    //   - Old transactions reference categoryId from old namespace.
    //     Wiping transactions is the safe way to keep the local DB consistent.
    //   - We disable foreign_keys while dropping transactions and categories
    //     because the FK from transactions.categoryId would otherwise block
    //     the DROP TABLE.
    version: 4,
    statements: [
      { sql: 'PRAGMA foreign_keys = OFF' },
      { sql: 'DELETE FROM transactions' },
      { sql: "DELETE FROM outbox WHERE entity IN ('categories', 'transactions')" },
      { sql: 'DROP TABLE categories' },
      {
        sql: `CREATE TABLE categories (
          categoryId TEXT PRIMARY KEY,
          groupId TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          isDefault INTEGER NOT NULL DEFAULT 1,
          isHidden INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1
        )`,
      },
      { sql: 'CREATE INDEX idx_categories_groupId ON categories(groupId)' },
      { sql: 'CREATE INDEX idx_categories_type ON categories(type)' },
      { sql: 'PRAGMA foreign_keys = ON' },
    ],
  },
  {
    // Migration v5: Reduce default categories from 139 subIcons down to 17 root groups.
    // To prevent data loss, we first remap any transactions pointing to the old subIcons
    // to point to the new root group category ID.
    // Then we delete all existing default categories and let the seeder re-run with the 17 groups.
    version: 5,
    statements: (() => {
      const stmts: { sql: string; params?: any[] }[] = [];
      // Turn off foreign keys temporarily so we can migrate
      stmts.push({ sql: 'PRAGMA foreign_keys = OFF' });
      
      for (const group of categoryGroups) {
        // We will derive the new group-level categoryId here in the statement generation
        // using a placeholder, but actually we need it resolved. Since statements can't be async here,
        // we do the update via a joined query: we know the old categories have `groupId`.
        // Wait, we can't derive UUIDv5 in pure SQLite.
        // Instead of doing it in the array, let's execute the updates in the runner, OR we can
        // just delete categories, and any orphaned transaction will not have a category until
        // the user fixes it. Wait! We CAN do it here by calling deriveDefaultCategoryId inside the migration logic?
        // Let's add a special logic for v5 in runMigrations.
        // So here we just define empty statements, and handle v5 logic in `runMigrations`.
      }
      stmts.push({ sql: 'PRAGMA foreign_keys = ON' });
      return stmts;
    })(),
  },
];

const getUserVersion = async () => {
  const row = await queryOne<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
};

const setUserVersion = async (version: number) => {
  await executeSql(`PRAGMA user_version = ${version}`);
};

/**
 * Flatten categoryGroups into 1 row per Group. Each group becomes
 * one Category row.
 *
 * Skip the synthetic `incomeGroups` (salary/bonus/investment/freelance/gift)
 * defined alongside `categoryGroups` — those are just UI hints.
 */
const flattenCategoryGroups = (): { groupId: string; type: 'EXPENSE' | 'INCOME'; icon: string; label: string; color: string }[] => {
  const rows: { groupId: string; type: 'EXPENSE' | 'INCOME'; icon: string; label: string; color: string }[] = [];
  for (const group of categoryGroups) {
    rows.push({ groupId: group.id, type: group.type, icon: group.icon, label: group.name, color: group.color });
  }
  return rows;
};

const seedAllCategories = async () => {
  const now = new Date().toISOString();
  const rows = flattenCategoryGroups();
  for (const row of rows) {
    const categoryId = await deriveDefaultCategoryId(row.groupId, row.icon);
    await executeSql(
      `INSERT OR REPLACE INTO categories
       (categoryId, groupId, name, type, icon, color, isDefault, isHidden, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [categoryId, row.groupId, row.label, row.type, row.icon, row.color, now, now],
    );
  }
};

export const runMigrations = async () => {
  const currentVersion = await getUserVersion();
  const pending = migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);

  let shouldSeedCategories = false;

  for (const migration of pending) {
    // Special logic for v5 data migration (mapping subIcon categories to root group category)
    if (migration.version === 5) {
      await executeSql('PRAGMA foreign_keys = OFF');
      
      // For each group, we derive the new root category ID, and update all transactions 
      // that currently point to any category in this groupId.
      for (const group of categoryGroups) {
        const newRootCategoryId = await deriveDefaultCategoryId(group.id, group.icon);
        await executeSql(
          `UPDATE transactions 
           SET categoryId = ? 
           WHERE categoryId IN (
             SELECT categoryId FROM categories WHERE groupId = ? AND isDefault = 1
           )`,
          [newRootCategoryId, group.id]
        );
      }
      
      // Delete all old default categories
      await executeSql('DELETE FROM categories WHERE isDefault = 1');
      await executeSql("DELETE FROM outbox WHERE entity = 'categories'");
      await executeSql('PRAGMA foreign_keys = ON');
    } else if (migration.statements.length > 0) {
      await executeBatch(migration.statements);
    }
    
    await setUserVersion(migration.version);

    // If any migration touches categories, we flag it to re-seed once at the end.
    if (migration.version === 1 || migration.version === 4 || migration.version === 5) {
      shouldSeedCategories = true;
    }
  }

  if (shouldSeedCategories) {
    await seedAllCategories();
  }
};
