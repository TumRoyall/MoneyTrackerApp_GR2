# Migration Plan (TO-BE)

## 1) Database
- Chuan hoa naming (wallets, transactions, categories, budgets)
- Them field:
  - categories.is_hidden
  - budgets.period_type (custom, monthly)
- Doi ten cot neu can:
  - current_value -> current_balance
- Them/kiem tra FK:
  - transactions.wallet_id -> wallets.wallet_id
  - transactions.category_id -> categories.category_id
  - transactions.created_by -> users.user_id
  - budgets.category_id -> categories.category_id
  - budgets.user_id -> users.user_id
- Tao index theo TO-BE

## 2) API
- Chuan hoa response theo convention
- Bo sung endpoint con thieu:
  - user profile
  - budget/report/data-management

## 3) Code (khi duoc phep)
- Tach use-case layer cho tung module
- Doi repository/DTO theo TO-BE
- Tinh toan so du dua vao TransactionBalancePolicy

## 4) Rollout
- Cap nhat docs -> DB migration -> API changes -> code refactor
- Test manual theo flows
