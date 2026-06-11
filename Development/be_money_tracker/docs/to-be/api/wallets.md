# wallets API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/wallets
- purpose: list vi
- response: { data: [wallet] }

### GET /api/wallets/{walletId}
- purpose: xem chi tiet vi
- response: { data: wallet }

### POST /api/wallets
- purpose: tao vi
- request body:
  - name
  - type
  - currency
  - currentBalance (optional)
  - description (optional)
- response: { data: wallet }

### PUT /api/wallets/{walletId}
- purpose: cap nhat vi
- request body:
  - name (optional)
  - type (optional)
  - currency (optional)
  - description (optional)
- response: { data: wallet }

### DELETE /api/wallets/{walletId}
- purpose: xoa vi
- response: 204

## Notes
- JWT required
