# wallets API

## Base URL
/api

## Endpoints

### POST /api/wallets
- purpose: tao wallet
- request body (CreateWalletRequest):
  - name (string, required)
  - currentBalance (decimal, optional)
  - currency (string, required)
  - description (string, optional)
  - type (REGULAR, CASH, SAVING, DEBT, INVEST, EVENT) (required)
- response body (WalletResponse):
  - walletId (UUID)
  - name (string)
  - type (string)
  - currency (string)
  - currentBalance (decimal)
  - description (string)
  - createdAt (timestamp)

### GET /api/wallets
- purpose: lay danh sach wallet cua user
- response: list of WalletResponse

### GET /api/wallets/{walletId}
- purpose: xem chi tiet vi (bao gom so du)
- response body: WalletResponse

### PUT /api/wallets/{walletId}
- purpose: cap nhat thong tin vi
- request body:
  - name (string, optional)
  - currency (string, optional)
  - description (string, optional)
  - type (string, optional)
- response body: WalletResponse

### DELETE /api/wallets/{walletId}
- purpose: soft delete wallet
- response: 204 No Content

## Notes
- JWT required cho tat ca endpoint
