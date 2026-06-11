# Database TO-BE

## Quy uoc
- PK/FK: UUID
- snake_case cho table/column
- created_at, updated_at, deleted_at
- soft delete bang deleted_at
- DECIMAL(18,2) cho so tien

## Tables

### users
- user_id (UUID, PK)
- email (unique)
- password_hash
- provider
- full_name
- is_admin
- is_verified
- verification_token (nullable)
- verification_sent_at (nullable)
- reset_password_token (nullable)
- reset_password_sent_at (nullable)
- created_at, updated_at, deleted_at
- version

### wallets
- wallet_id (UUID, PK)
- user_id (UUID, FK -> users)
- name
- type
- currency
- current_balance
- description
- created_at, updated_at, deleted_at
- version

### categories
- category_id (UUID, PK)
- user_id (UUID, FK -> users, nullable)
- name
- type (EXPENSE, INCOME)
- icon
- color
- is_default
- is_hidden
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
- period_type (custom, monthly)
- alert_threshold (nullable)
- created_at, updated_at, deleted_at
- version

## Planned

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

### data_backups
- backup_id (UUID, PK)
- user_id (UUID, FK -> users)
- storage_uri (cloud)
- status
- created_at

## Indexes
- transactions (wallet_id, tx_date)
- transactions (created_by)
- transactions (category_id)
- budgets (user_id, category_id, period_start, period_end)
