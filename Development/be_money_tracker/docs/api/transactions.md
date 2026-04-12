# transactions API

## Base URL
/api

## Endpoints

### GET /api/transactions
- purpose: lay danh sach giao dich co filter va paging
- query:
  - walletId (UUID, required)
  - categoryId (UUID, optional)
  - type (INCOME, EXPENSE, optional)
  - fromDate (YYYY-MM-DD, optional)
  - toDate (YYYY-MM-DD, optional)
  - minAmount (decimal, optional)
  - maxAmount (decimal, optional)
  - keyword (string, optional)
  - page, size, sort (paging)
- response body: Page<TransactionResponse>
  - transactionId (UUID)
  - walletId (UUID)
  - categoryId (UUID)
  - amount (decimal)
  - note (string)
  - date (YYYY-MM-DD)
  - createdAt (timestamp)
  - updatedAt (timestamp)

### GET /api/transactions/{id}
- purpose: xem chi tiet giao dich
- response body: TransactionResponse

### POST /api/transactions
- purpose: tao giao dich
- request body (CreateTransactionRequest):
  - walletId (UUID)
  - categoryId (UUID)
  - amount (decimal)
  - note (string, optional)
  - date (YYYY-MM-DD)
- response body: TransactionResponse

### PUT /api/transactions/{id}
- purpose: cap nhat giao dich
- request body (UpdateTransactionRequest):
  - categoryId (UUID)
  - amount (decimal)
  - note (string, optional)
  - date (YYYY-MM-DD)
- response body: TransactionResponse

### DELETE /api/transactions/{id}
- purpose: xoa giao dich
- response: 204 No Content

## Notes
- JWT required cho tat ca endpoint
