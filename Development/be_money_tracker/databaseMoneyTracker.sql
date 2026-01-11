-- ===========================
-- USERS
-- ===========================
CREATE TABLE users (
    user_id       BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    provider      VARCHAR(50)  NOT NULL,
    full_name     VARCHAR(255),
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_delete     BOOLEAN      NOT NULL DEFAULT FALSE
);

ALTER TABLE users
ADD COLUMN verification_token VARCHAR(255),   -- Xác thực email
ADD COLUMN verification_sent_at TIMESTAMPTZ;  -- Thời gian gửi xác thực

-- ===========================
-- ACCOUNTS
-- ===========================
-- REGULAR / CASH / SAVING / DEBT / INVEST / EVENT
CREATE TABLE accounts (
    account_id    BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL,
    type          VARCHAR(50) NOT NULL,
    account_name  VARCHAR(255) NOT NULL,
    current_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    currency      VARCHAR(10) NOT NULL DEFAULT 'VND',
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description   TEXT,

    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===========================
-- SAVINGS (mở rộng cho account type = SAVING)
-- ===========================
CREATE TABLE savings (
    saving_id     BIGINT PRIMARY KEY,  -- FK sang accounts
    target_amount DECIMAL(18,2) NOT NULL,
    target_date   DATE NOT NULL,
    status        VARCHAR(50) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_savings_account
        FOREIGN KEY (saving_id) REFERENCES accounts(account_id)
);

-- ===========================
-- INVESTMENTS (mở rộng cho account type = INVEST)
-- ===========================
CREATE TABLE investments (
    invest_id      BIGINT PRIMARY KEY,  -- FK sang accounts
    total_invested DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_investments_account
        FOREIGN KEY (invest_id) REFERENCES accounts(account_id)
);

-- ===========================
-- DEBTS (mở rộng cho account type = DEBT)
-- ===========================
CREATE TABLE debts (
    debt_id         BIGINT PRIMARY KEY,   -- FK sang accounts
    minimum_payment DECIMAL(18,2) NOT NULL,
    original_amount DECIMAL(18,2) NOT NULL,
    remaining       DECIMAL(18,2) NOT NULL,
    due_date        DATE NOT NULL,
    status          VARCHAR(50) NOT NULL,

    CONSTRAINT fk_debts_account
        FOREIGN KEY (debt_id) REFERENCES accounts(account_id)
);

-- ===========================
-- EVENTS (mở rộng cho account type = EVENT)
-- event_id = account_id
-- ===========================
CREATE TABLE events (
    event_id   BIGINT PRIMARY KEY,  -- FK sang accounts
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,

    CONSTRAINT fk_events_account
        FOREIGN KEY (event_id) REFERENCES accounts(account_id)
);

-- ===========================
-- EVENT MEMBERS
-- ===========================
CREATE TABLE event_members (
    event_id BIGINT NOT NULL,
    user_id  BIGINT NOT NULL,

    PRIMARY KEY (event_id, user_id),

    CONSTRAINT fk_event_members_event
        FOREIGN KEY (event_id) REFERENCES events(event_id),

    CONSTRAINT fk_event_members_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===========================
-- CATEGORIES
-- ===========================
CREATE TABLE categories (
    category_id BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50)  NOT NULL,   -- EXPENSE / INCOME
    icon        VARCHAR(255),
    color       VARCHAR(50),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===========================
-- TRANSACTIONS
-- ===========================
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id     BIGINT NOT NULL,
    created_by     BIGINT NOT NULL,
    category_id    BIGINT NOT NULL,
    amount         DECIMAL(18,2) NOT NULL,
    note           TEXT,
    date           DATE NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES accounts(account_id),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (created_by) REFERENCES users(user_id),

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- ===========================
-- BUDGETS
-- ===========================
CREATE TABLE budgets (
    budget_id       BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    category_id     BIGINT NOT NULL,
    amount_limit    DECIMAL(18,2) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    notify_threshold DECIMAL(5,2) NOT NULL, -- ví dụ: 0.8 = 80%

    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX idx_tx_account_date ON transactions(account_id, date);
CREATE INDEX idx_tx_created_by ON transactions(created_by);
CREATE INDEX idx_tx_category ON transactions(category_id);

ALTER TABLE categories
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
