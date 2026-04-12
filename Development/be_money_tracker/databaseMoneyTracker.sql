-- ===========================
-- USERS
-- ===========================
CREATE TABLE users (
    user_id                 CHAR(36) PRIMARY KEY,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    provider                VARCHAR(50)  NOT NULL,
    full_name               VARCHAR(255),
    is_admin                TINYINT NOT NULL DEFAULT 0,
    is_verified             TINYINT NOT NULL DEFAULT 0,
    verification_token      VARCHAR(255),
    verification_sent_at    DATETIME NULL,
    reset_password_token    VARCHAR(255),
    reset_password_sent_at  DATETIME NULL,
    created_at              DATETIME NOT NULL,
    updated_at              DATETIME NOT NULL,
    deleted_at              DATETIME NULL,
    version                 BIGINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- WALLETS
-- ===========================
CREATE TABLE wallets (
    wallet_id        CHAR(36) PRIMARY KEY,
    user_id          CHAR(36) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    type             VARCHAR(50) NOT NULL,
    currency         VARCHAR(10) NOT NULL,
    current_balance  DECIMAL(18,2) NOT NULL DEFAULT 0,
    description      TEXT,
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL,
    deleted_at       DATETIME NULL,
    version          BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT fk_wallets_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- CATEGORIES
-- ===========================
CREATE TABLE categories (
    category_id  CHAR(36) PRIMARY KEY,
    user_id      CHAR(36) NULL,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(50) NOT NULL,
    icon         VARCHAR(255),
    color        VARCHAR(50),
    is_default   TINYINT NOT NULL DEFAULT 0,
    is_hidden    TINYINT NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL,
    deleted_at   DATETIME NULL,
    version      BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- TRANSACTIONS
-- ===========================
CREATE TABLE transactions (
    transaction_id  CHAR(36) PRIMARY KEY,
    wallet_id       CHAR(36) NOT NULL,
    created_by      CHAR(36) NOT NULL,
    category_id     CHAR(36) NOT NULL,
    amount          DECIMAL(18,2) NOT NULL,
    note            TEXT,
    tx_date         DATE NOT NULL,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    deleted_at      DATETIME NULL,
    version         BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT fk_transactions_wallet
        FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- BUDGETS
-- ===========================
CREATE TABLE budgets (
    budget_id        CHAR(36) PRIMARY KEY,
    user_id          CHAR(36) NOT NULL,
    category_id      CHAR(36) NOT NULL,
    amount_limit     DECIMAL(18,2) NOT NULL,
    period_start     DATE NOT NULL,
    period_end       DATE NOT NULL,
    period_type      VARCHAR(20) NOT NULL,
    alert_threshold  DECIMAL(5,2),
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL,
    deleted_at       DATETIME NULL,
    version          BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- PLANNED: SYNC
-- ===========================
CREATE TABLE sync_change_log (
    cursor_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     CHAR(36) NOT NULL,
    entity      VARCHAR(50) NOT NULL,
    entity_pk   CHAR(36) NOT NULL,
    op          VARCHAR(10) NOT NULL,
    changed_at  DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sync_push_dedup (
    user_id      CHAR(36) NOT NULL,
    device_id    VARCHAR(100) NOT NULL,
    op_id        CHAR(36) NOT NULL,
    received_at  DATETIME NOT NULL,
    PRIMARY KEY (user_id, device_id, op_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- PLANNED: DATA BACKUP
-- ===========================
CREATE TABLE data_backups (
    backup_id    CHAR(36) PRIMARY KEY,
    user_id      CHAR(36) NOT NULL,
    storage_uri  TEXT NOT NULL,
    status       VARCHAR(50) NOT NULL,
    created_at   DATETIME NOT NULL,

    CONSTRAINT fk_backups_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX idx_tx_wallet_date
    ON transactions(wallet_id, tx_date);

CREATE INDEX idx_tx_created_by
    ON transactions(created_by);

CREATE INDEX idx_tx_category
    ON transactions(category_id);

CREATE INDEX idx_budget_user_cat_period
    ON budgets(user_id, category_id, period_start, period_end);
