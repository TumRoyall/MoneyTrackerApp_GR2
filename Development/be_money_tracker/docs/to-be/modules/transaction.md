# transaction (TO-BE)

## 1. Purpose
Quan ly giao dich va cap nhat so du vi.

## 2. Data Model
- transactions: transaction_id, wallet_id, created_by, category_id, amount, note, tx_date
- wallets: current_balance cap nhat theo giao dich

## 3. Business Logic
- List giao dich theo vi
- Xem chi tiet giao dich
- Tao giao dich (update balance)
- Cap nhat giao dich (rollback/apply)
- Xoa giao dich (rollback)
- Loc theo category, type, time, amount, keyword
- Tim kiem giao dich

## 4. API
- GET /api/transactions
- GET /api/transactions/{transactionId}
- POST /api/transactions
- PUT /api/transactions/{transactionId}
- DELETE /api/transactions/{transactionId}

## 5. Flow
- transactions-list-flow.md
- transactions-detail-flow.md
- transactions-create-flow.md
- transactions-update-flow.md
- transactions-delete-flow.md
- transactions-filter-flow.md

## 6. Edge Cases
- Vi khong thuoc user
- Category khong thuoc user
- Sai type category

## 7. Notes
- Amount luon duong, dau suy ra tu category type
