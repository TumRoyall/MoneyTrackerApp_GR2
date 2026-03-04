import * as SQLite from "expo-sqlite";

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- =========================================
-- USERS (LOCAL)
-- =========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id       TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  is_verified   INTEGER NOT NULL DEFAULT 0,
  
  access_token  TEXT,
  refresh_token TEXT,
  token_exp_at  INTEGER,
  
  created_at    TIME NOT NULL,
  updated_at    TIME NOT NULL,
  deleted_at    TIME,
  
  version       INTEGER NOT NULL DEFAULT 1
);

-- =========================================
-- ACCOUNTS
-- =========================================
CREATE TABLE IF NOT EXISTS accounts (
  account_id    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  type          TEXT NOT NULL,
  account_name  TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'VND',
  description   TEXT,
  current_value REAL NOT NULL DEFAULT 0,
  
  created_at    TIME NOT NULL,
  updated_at    TIME NOT NULL,
  deleted_at    TIME,
  
  version       INTEGER NOT NULL DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at);

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE IF NOT EXISTS categories (
  category_id   TEXT PRIMARY KEY,
  user_id       TEXT,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  icon          TEXT,
  color         TEXT,
  is_default    INTEGER NOT NULL DEFAULT 0,
  
  created_at    TIME NOT NULL,
  updated_at    TIME NOT NULL,
  deleted_at    TIME,
  
  version       INTEGER NOT NULL DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);

-- =========================================
-- TRANSACTIONS
-- =========================================
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id TEXT PRIMARY KEY,
  account_id     TEXT NOT NULL,
  created_by     TEXT NOT NULL,
  category_id    TEXT NOT NULL,
  
  amount         REAL NOT NULL,
  note           TEXT,
  tx_date        TEXT NOT NULL,
  
  created_at     TIME NOT NULL,
  updated_at     TIME NOT NULL,
  deleted_at     TIME,
  
  version        INTEGER NOT NULL DEFAULT 1,
  
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES user_profiles(user_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX IF NOT EXISTS idx_tx_account_date ON transactions(account_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_tx_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_tx_deleted ON transactions(deleted_at);

-- =========================================
-- BUDGETS
-- =========================================
CREATE TABLE IF NOT EXISTS budgets (
  budget_id      TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  category_id    TEXT NOT NULL,
  
  amount_limit   REAL NOT NULL,
  start_date     TEXT NOT NULL,
  end_date       TEXT NOT NULL,
  notify_threshold REAL NOT NULL,
  
  created_at     TIME NOT NULL,
  updated_at     TIME NOT NULL,
  deleted_at     TIME,
  
  version        INTEGER NOT NULL DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_deleted ON budgets(deleted_at);

-- =========================================
-- SYNC SUPPORT TABLES
-- =========================================

-- Sync state theo (user_id, device_id)
CREATE TABLE IF NOT EXISTS sync_state (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  last_cursor INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIME,
  
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Outbox client-side để track pending changes
CREATE TABLE IF NOT EXISTS sync_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIME NOT NULL,
  synced_at TIME,
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_user_synced ON sync_outbox(user_id, synced_at);
`;

/**
 * Initialize database schema
 */
export const initializeSchema = async (
  database: SQLite.SQLiteDatabase,
): Promise<void> => {
  try {
    // Split into individual statements and execute
    const statements = SCHEMA_SQL.split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await database.execAsync(statement);
    }

    console.log("[Schema] Database schema initialized successfully");
  } catch (error) {
    console.error("[Schema] Error initializing schema:", error);
    throw error;
  }
};
