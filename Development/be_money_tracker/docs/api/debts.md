# debts API

## Base URL
/api

## Endpoints

### POST /api/debts
- purpose: tao mon no (tu dong tao vi DEBT)
- request body:
  - title (string, required)
  - targetAmount (decimal, required)
  - currency (string, required)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
- response body:
  - debtId (UUID)
  - walletId (UUID)
  - walletName (string)
  - currency (string)
  - currentBalance (decimal)
  - title (string)
  - targetAmount (decimal)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
  - createdAt, updatedAt (timestamp)

### GET /api/debts
- purpose: lay danh sach mon no
- response: list of DebtResponse

### GET /api/debts/{debtId}
- purpose: xem chi tiet mon no
- response: DebtResponse

### PUT /api/debts/{debtId}
- purpose: cap nhat mon no
- request body:
  - title (string, optional)
  - targetAmount (decimal, optional)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
- response: DebtResponse

### DELETE /api/debts/{debtId}
- purpose: xoa mon no (soft delete) va dong bo xoa vi DEBT
- response: 204 No Content

## Notes
- Mon no la 1 wallet type DEBT
- Thanh toan no lay tu giao dich INCOME/EXPENSE trong wallet DEBT
