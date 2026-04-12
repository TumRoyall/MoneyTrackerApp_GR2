# wallet (TO-BE)

## 1. Purpose
Quan ly vi cua user.

## 2. Data Model
- wallets: wallet_id, user_id, name, type, currency, current_balance, description

## 3. Business Logic
- Tao vi
- Xem danh sach vi
- Xem chi tiet vi va so du
- Cap nhat thong tin vi
- Xoa vi

## 4. API
- POST /api/wallets
- GET /api/wallets
- GET /api/wallets/{walletId}
- PUT /api/wallets/{walletId}
- DELETE /api/wallets/{walletId}

## 5. Flow
- wallets-create-flow.md
- wallets-list-flow.md
- wallets-detail-flow.md
- wallets-update-flow.md
- wallets-delete-flow.md

## 6. Edge Cases
- Trung ten vi trong cung user
- Xoa vi co giao dich

## 7. Notes
- Can quy dinh chinh sach xoa vi
