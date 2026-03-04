PRAGMA foreign_keys = ON;
-- =========================================
-- USERS (LOCAL)
-- Chỉ lưu profile tối thiểu + token, KHÔNG lưu password_hash/verification_token
-- =========================================

CREATE TABLE IF NOT EXISTS user_profile (
  user_id     TEXT PRIMARY KEY,   -- server user id string, hoặc UUID app tự sinh
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
  id            TEXT PRIMARY KEY,     -- local UUID
  server_id      INTEGER,              -- BIGINT from server (nullable)

  user_id        TEXT NOT NULL,        -- profile.user_id
  type           TEXT NOT NULL,         -- REGULAR/CASH/SAVING/DEBT/INVEST/EVENT
  account_name   TEXT NOT NULL,
  current_value  REAL NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'VND',
  description    TEXT,

  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL,      -- epoch ms
  deleted_at     INTEGER,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING' -- PENDING|SYNCED|FAILED
);

CREATE INDEX IF NOT EXISTS idx_accounts_user
ON accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_server
ON accounts(server_id);

CREATE INDEX IF NOT EXISTS idx_accounts_type
ON accounts(type);

-- SAVINGS (account type = SAVING)
CREATE TABLE IF NOT EXISTS savings (
  id            TEXT PRIMARY KEY,      -- local UUID
  server_id      INTEGER,

  account_id     TEXT NOT NULL,        -- FK accounts.id
  target_amount  REAL NOT NULL,
  target_date    TEXT NOT NULL,        -- 'YYYY-MM-DD'
  status         TEXT NOT NULL,

  version        INTEGER NOT NULL DEFAULT 1,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER,
  sync_status    TEXT NOT NULL DEFAULT 'PENDING',

  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_savings_account
ON savings(account_id);

-- INVESTMENTS (account type = INVEST)
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

-- DEBTS (account type = DEBT)
CREATE TABLE IF NOT EXISTS debts (
  id              TEXT PRIMARY KEY,
  server_id        INTEGER,

  account_id       TEXT NOT NULL,
  minimum_payment  REAL NOT NULL,
  original_amount  REAL NOT NULL,
  remaining        REAL NOT NULL,
  due_date         TEXT NOT NULL,       -- 'YYYY-MM-DD'
  status           TEXT NOT NULL,

  version          INTEGER NOT NULL DEFAULT 1,
  updated_at       INTEGER NOT NULL,
  deleted_at       INTEGER,
  sync_status      TEXT NOT NULL DEFAULT 'PENDING',

  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_debts_account
ON debts(account_id);

-- EVENTS (account type = EVENT)
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

-- EVENT MEMBERS (nếu có chia sẻ event)
CREATE TABLE IF NOT EXISTS event_members (
  event_id     TEXT NOT NULL,
  member_user_id TEXT NOT NULL,         -- user_id của member (string)

  role         TEXT,                    -- optional
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
  id          TEXT PRIMARY KEY,     -- local UUID
  server_id    INTEGER,

  user_id     TEXT,                 -- null nếu default global
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,         -- EXPENSE/INCOME
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
  id            TEXT PRIMARY KEY,   -- local UUID
  server_id      INTEGER,

  account_id     TEXT NOT NULL,      -- accounts.id
  created_by     TEXT NOT NULL,      -- user_id (string)
  category_id    TEXT NOT NULL,      -- categories.id

  amount         REAL NOT NULL,
  note           TEXT,
  date           TEXT NOT NULL,      -- 'YYYY-MM-DD'

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
  notify_threshold  REAL NOT NULL,     -- 0.8 = 80%

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