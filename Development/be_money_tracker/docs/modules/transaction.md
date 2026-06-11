# transaction

## 1. Purpose
Quan ly giao dich va cap nhat so du vi.

## 2. Data Model
- transactions: transaction_id, wallet_id, created_by, category_id, amount, note, tx_date
- wallets: current_balance duoc cap nhat khi co giao dich

## 3. Business Logic
- Tao giao dich va cap nhat so du
- Cap nhat giao dich va rollback/apply so du
- Xoa giao dich va rollback so du
- Xem danh sach giao dich
- Xem chi tiet giao dich
- Loc theo wallet, category, type, khoang ngay, amount, keyword
- Tim kiem giao dich (keyword)
- (Include) Chon vi

## 4. API
- GET /api/transactions
- GET /api/transactions/{id}
- POST /api/transactions
- PUT /api/transactions/{id}
- DELETE /api/transactions/{id}

## 5. Flow
- transactions-create-flow.md
- transactions-list-flow.md
- transactions-detail-flow.md
- transactions-filter-flow.md
- transactions-update-flow.md
- transactions-delete-flow.md

## 6. Edge Cases
- Tu choi truy cap wallet hoac category
- Type khong hop le (khong phai INCOME/EXPENSE)
- Mat can doi so du khi update/delete

## 7. Notes
- Amount luon duong; dau am/duong suy ra tu category type
