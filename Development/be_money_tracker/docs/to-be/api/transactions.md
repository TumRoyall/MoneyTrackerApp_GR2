# transactions API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/transactions
- purpose: list giao dich (filter + paging)
- query:
  - walletId (UUID, required)
  - categoryId (UUID, optional)
  - type (INCOME, EXPENSE, optional)
  - fromDate, toDate (YYYY-MM-DD)
  - minAmount, maxAmount
  - keyword
  - page, size, sort
- response: { data: [transaction], meta }

### GET /api/transactions/{transactionId}
- purpose: xem chi tiet giao dich
- response: { data: transaction }

### POST /api/transactions
- purpose: tao giao dich
- request body:
  - walletId
  - categoryId
  - amount
  - note (optional)
  - date (YYYY-MM-DD)
- response: { data: transaction }

### PUT /api/transactions/{transactionId}
- purpose: cap nhat giao dich
- request body:
  - categoryId
  - amount
  - note (optional)
  - date
- response: { data: transaction }

### DELETE /api/transactions/{transactionId}
- purpose: xoa giao dich
- response: 204

## Notes
- JWT required
