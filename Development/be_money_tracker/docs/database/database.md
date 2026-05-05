# Thiet ke database

## Rules
- Primary keys: UUID
- Foreign keys: UUID
- Timestamps: created_at, updated_at
- Soft delete: deleted_at (nullable)
- Monetary: DECIMAL(18,2)

## Tables (trong scope)

### users
- user_id (UUID, PK)
- email (unique)
- password_hash
- provider (local, google, github)
- full_name
- is_admin
- is_verified
- verification_token (nullable)
- verification_sent_at (nullable)
- created_at, updated_at, deleted_at
- version

### wallets
- wallet_id (UUID, PK)
- user_id (UUID, FK -> users)
- type (REGULAR, CASH, SAVING, DEBT, INVEST, EVENT)
- name
- current_balance
- currency
- description
- created_at, updated_at, deleted_at
- version

### categories
- category_id (UUID, PK)
- user_id (UUID, FK -> users, nullable cho category mac dinh)
- name
- type (EXPENSE, INCOME)
- icon
- color
- is_hidden
- is_default
- created_at, updated_at, deleted_at
- version

### transactions
- transaction_id (UUID, PK)
- wallet_id (UUID, FK -> wallets)
- created_by (UUID, FK -> users)
- category_id (UUID, FK -> categories)
- amount
- note
- tx_date
- created_at, updated_at, deleted_at
- version

### budgets
- budget_id (UUID, PK)
- user_id (UUID, FK -> users)
- category_id (UUID, FK -> categories)
- amount_limit
- period_start
- period_end
- period_type (custom, monthly, weekly, biweekly, yearly)
- alert_threshold (nullable)
- created_at, updated_at, deleted_at
- version

## Tables (planned)

### sync_change_log
- cursor_id (BIGINT identity, PK)
- user_id (UUID)
- entity
- entity_pk (UUID)
- op (UPSERT, DELETE)
- changed_at

### sync_push_dedup
- user_id (UUID)
- device_id
- op_id (UUID)
- received_at
- primary key: (user_id, device_id, op_id)

### data_backups (planned)
- backup_id (UUID, PK)
- user_id (UUID, FK -> users)
- storage_uri (cloud)
- status
- created_at

## Indexes
- transactions (wallet_id, tx_date)
- transactions (created_by)
- transactions (category_id)