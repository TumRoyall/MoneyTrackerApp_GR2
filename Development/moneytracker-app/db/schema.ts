import * as SQLite from "expo-sqlite";

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- =========================================
-- USERS (LOCAL)
-- =========================================
CREATE TABLE IF NOT EXISTS user_profile (
  user_id     TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  is_admin    INTEGER NOT NULL DEFAULT 0,
  is_verified INTEGER NOT NULL DEFAULT 0,
  access_token  TEXT,
  refresh_token TEXT,
  token_exp_at  INTEGER,
  created_at  INTEGER,
  updated_at  INTEGER
);

-- =========================================
-- ACCOUNTS + EXTENSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS accounts (
  id            TEXT PRIMARY KEY,
  server_id      INTEGER,
  user_id        TEXT NOT NULL,
  type           TEXT NOT NULL,
  account_name   TEXT NOT NULL,
  current_value  REAL NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'VND',
  description    TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_accounts_user
ON accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_server
ON accounts(server_id);

CREATE INDEX IF NOT EXISTS idx_accounts_type
ON accounts(type);

-- SAVINGS
CREATE TABLE IF NOT EXISTS savings (
  id            TEXT PRIMARY KEY,
  server_id      INTEGER,
  account_id     TEXT NOT NULL,
  target_amount  REAL NOT NULL,
  target_date    TEXT NOT NULL,
  status         TEXT NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_savings_account
ON savings(account_id);

-- INVESTMENTS
CREATE TABLE IF NOT EXISTS investments (
  id              TEXT PRIMARY KEY,
  server_id        INTEGER,
  account_id       TEXT NOT NULL,
  total_invested   REAL NOT NULL DEFAULT 0,
  version          INTEGER NOT NULL DEFAULT 1,
  updated_at       INTEGER NOT NULL,
  deleted_at       INTEGER,
  sync_status      TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_investments_account
ON investments(account_id);

-- DEBTS
CREATE TABLE IF NOT EXISTS debts (
  id              TEXT PRIMARY KEY,
  server_id        INTEGER,
  account_id       TEXT NOT NULL,
  minimum_payment  REAL NOT NULL,
  original_amount  REAL NOT NULL,
  remaining        REAL NOT NULL,
  due_date         TEXT NOT NULL,
  status           TEXT NOT NULL,
  version          INTEGER NOT NULL DEFAULT 1,
  updated_at       INTEGER NOT NULL,
  deleted_at       INTEGER,
  sync_status      TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_debts_account
ON debts(account_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  server_id    INTEGER,
  account_id   TEXT NOT NULL,
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  sync_status  TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_account
ON events(account_id);

-- EVENT MEMBERS
CREATE TABLE IF NOT EXISTS event_members (
  event_id     TEXT NOT NULL,
  member_user_id TEXT NOT NULL,
  role         TEXT,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (event_id, member_user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_members_user
ON event_members(member_user_id);

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  server_id    INTEGER,
  user_id     TEXT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_categories_user
ON categories(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_type
ON categories(type);

CREATE INDEX IF NOT EXISTS idx_categories_server
ON categories(server_id);

-- =========================================
-- TRANSACTIONS
-- =========================================
CREATE TABLE IF NOT EXISTS transactions (
  id            TEXT PRIMARY KEY,
  server_id      INTEGER,
  account_id     TEXT NOT NULL,
  created_by     TEXT NOT NULL,
  category_id    TEXT NOT NULL,
  amount         REAL NOT NULL,
  note           TEXT,
  date           TEXT NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_tx_account_date
ON transactions(account_id, date);

CREATE INDEX IF NOT EXISTS idx_tx_created_by
ON transactions(created_by);

CREATE INDEX IF NOT EXISTS idx_tx_category
ON transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_tx_server
ON transactions(server_id);

-- =========================================
-- BUDGETS
-- =========================================
CREATE TABLE IF NOT EXISTS budgets (
  id               TEXT PRIMARY KEY,
  server_id         INTEGER,
  user_id           TEXT NOT NULL,
  category_id       TEXT NOT NULL,
  amount_limit      REAL NOT NULL,
  start_date        TEXT NOT NULL,
  end_date          TEXT NOT NULL,
  notify_threshold  REAL NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  updated_at        INTEGER NOT NULL,
  deleted_at        INTEGER,
  sync_status       TEXT NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user
ON budgets(user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_category
ON budgets(category_id);

CREATE INDEX IF NOT EXISTS idx_budgets_dates
ON budgets(start_date, end_date);
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
