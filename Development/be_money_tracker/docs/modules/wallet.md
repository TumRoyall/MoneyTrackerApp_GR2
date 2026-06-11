# wallet

## 1. Purpose
Quan ly vi cua user.

## 2. Data Model
- wallets: wallet_id, user_id, type, name, current_balance, currency, description

## 3. Business Logic
- Tao wallet voi name khong trung trong cung user
- Neu khong gui type thi default REGULAR
- Lay danh sach wallet cua user
- Xem chi tiet vi va so du
- Cap nhat thong tin vi
- Soft delete wallet

## 4. API
- POST /api/wallets
- GET /api/wallets
- GET /api/wallets/{walletId}
- PUT /api/wallets/{walletId}
- DELETE /api/wallets/{walletId}

## 5. Flow
- wallets-create-flow.md
- wallets-get-flow.md
- wallets-update-flow.md
- wallets-delete-flow.md

## 6. Edge Cases
- Trung ten wallet trong cung user
- Xoa wallet khong thuoc user
- Cap nhat wallet khong thuoc user

## 7. Notes
- Cac loai wallet khac co ton tai trong model nhung chua trong scope
