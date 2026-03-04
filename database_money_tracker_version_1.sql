-- =========================================
-- EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- hoặc dùng pgcrypto:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- COMMON: updated_at auto
-- =========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  full_name VARCHAR(255),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,

  verification_token VARCHAR(255),
  verification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- sync
  version BIGINT NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- ACCOUNTS
-- =========================================
-- REGULAR / CASH / SAVING / DEBT / INVEST
CREATE TABLE accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
  account_name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  description TEXT,

  -- NOTE: nếu sync multi-device, nên coi current_value là cache
  current_value NUMERIC(18,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- sync
  version BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT fk_accounts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- null = default/global category; có user_id = category riêng
  user_id UUID NULL,

  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- EXPENSE / INCOME
  icon VARCHAR(255),
  color VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- sync
  version BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_categories_user ON categories(user_id);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- TRANSACTIONS
-- =========================================
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  created_by UUID NOT NULL,
  category_id UUID NOT NULL,

  amount NUMERIC(18,2) NOT NULL,
  note TEXT,
  tx_date DATE NOT NULL, -- đổi tên tránh keyword "date"

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- sync
  version BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT fk_transactions_account
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),

  CONSTRAINT fk_transactions_user
    FOREIGN KEY (created_by) REFERENCES users(user_id),

  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX idx_tx_account_date ON transactions(account_id, tx_date);
CREATE INDEX idx_tx_created_by ON transactions(created_by);
CREATE INDEX idx_tx_category ON transactions(category_id);

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- BUDGETS
-- =========================================
CREATE TABLE budgets (
  budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,

  amount_limit NUMERIC(18,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notify_threshold NUMERIC(5,2) NOT NULL, -- 0.8 = 80%

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- sync
  version BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),

  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);

CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================
-- SYNC SUPPORT TABLES (cloud side)
-- =========================================

-- 1) Change log để pull delta theo cursor (server-controlled)
DROP TABLE IF EXISTS sync_change_log;

CREATE TABLE sync_change_log (
  cursor     BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  entity     VARCHAR(50) NOT NULL,   -- accounts/categories/transactions/budgets
  entity_pk  UUID NOT NULL,          -- UUID của entity
  op         VARCHAR(10) NOT NULL,   -- UPSERT / DELETE
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scl_user_cursor ON sync_change_log(user_id, cursor);
CREATE INDEX idx_scl_user_entity_pk ON sync_change_log(user_id, entity, entity_pk);

-- 2) Sync state theo (user_id, device_id)
CREATE TABLE sync_state (
  user_id UUID NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  last_cursor BIGINT NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, device_id),
  CONSTRAINT fk_sync_state_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 3) Outbox server-side để idempotent push (chống gửi trùng)
CREATE TABLE sync_push_dedup (
  user_id UUID NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  op_id UUID NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, device_id, op_id),
  CONSTRAINT fk_sync_push_dedup_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =========================================
-- CHANGE LOG TRIGGERS (ghi vào sync_change_log)
-- - Khi UPDATE/INSERT: op = UPSERT
-- - Khi soft delete (deleted_at set): op = DELETE (hoặc UPSERT tùy API)
-- =========================================
CREATE OR REPLACE FUNCTION log_change()
RETURNS TRIGGER AS $$
DECLARE
  v_op VARCHAR(10);
  v_entity VARCHAR(50);
  v_entity_pk UUID;
  v_user_id UUID;
BEGIN
  v_entity := TG_TABLE_NAME;

  IF TG_OP = 'DELETE' THEN
    v_op := 'DELETE';
    -- Lấy thông tin từ OLD record
    IF v_entity = 'users' THEN
      v_entity_pk := OLD.user_id; v_user_id := OLD.user_id;
    ELSIF v_entity = 'accounts' THEN
      v_entity_pk := OLD.account_id; v_user_id := OLD.user_id;
    ELSIF v_entity = 'categories' THEN
      v_entity_pk := OLD.category_id; v_user_id := OLD.user_id;
    ELSIF v_entity = 'transactions' THEN
      v_entity_pk := OLD.transaction_id; v_user_id := OLD.created_by;
    ELSIF v_entity = 'budgets' THEN
      v_entity_pk := OLD.budget_id; v_user_id := OLD.user_id;
    ELSE
      RETURN OLD;
    END IF;
    
    INSERT INTO sync_change_log(user_id, entity, entity_pk, op)
    VALUES (v_user_id, v_entity, v_entity_pk, v_op);
    
    RETURN OLD;
  END IF;

  -- detect soft delete
  IF NEW.deleted_at IS NOT NULL THEN
    v_op := 'DELETE';
  ELSE
    v_op := 'UPSERT';
  END IF;

  -- get PK + user_id per table
  IF v_entity = 'users' THEN
    v_entity_pk := NEW.user_id; v_user_id := NEW.user_id;
  ELSIF v_entity = 'accounts' THEN
    v_entity_pk := NEW.account_id; v_user_id := NEW.user_id;
  ELSIF v_entity = 'categories' THEN
    v_entity_pk := NEW.category_id; v_user_id := NEW.user_id;
  ELSIF v_entity = 'transactions' THEN
    v_entity_pk := NEW.transaction_id; v_user_id := NEW.created_by;
  ELSIF v_entity = 'budgets' THEN
    v_entity_pk := NEW.budget_id; v_user_id := NEW.user_id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO sync_change_log(user_id, entity, entity_pk, op)
  VALUES (v_user_id, v_entity, v_entity_pk, v_op);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- version++ mỗi lần UPDATE (để conflict check)
CREATE OR REPLACE FUNCTION bump_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- attach triggers
DO $$
BEGIN
  -- users
  CREATE TRIGGER trg_users_bump_version
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION bump_version();

  CREATE TRIGGER trg_users_log_change
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION log_change();

  -- accounts
  CREATE TRIGGER trg_accounts_bump_version
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION bump_version();

  CREATE TRIGGER trg_accounts_log_change
  AFTER INSERT OR UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION log_change();

  -- categories
  CREATE TRIGGER trg_categories_bump_version
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION bump_version();

  CREATE TRIGGER trg_categories_log_change
  AFTER INSERT OR UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_change();

  -- transactions
  CREATE TRIGGER trg_transactions_bump_version
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION bump_version();

  CREATE TRIGGER trg_transactions_log_change
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_change();

  -- budgets
  CREATE TRIGGER trg_budgets_bump_version
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION bump_version();

  CREATE TRIGGER trg_budgets_log_change
  AFTER INSERT OR UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION log_change();
END$$;