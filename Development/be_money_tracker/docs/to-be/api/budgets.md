# budgets API (TO-BE)

## Base URL
/api

## Endpoints

### POST /api/budgets
- purpose: tao ngan sach
- request body:
  - walletId (required)
  - categoryId (required)
  - amountLimit
  - periodStart
  - periodEnd
  - periodType (custom, monthly, weekly, biweekly, yearly)
  - alertThreshold (optional)
- response: { data: budget }

### GET /api/budgets
- purpose: list ngan sach
- response: { data: [budget] }

### GET /api/budgets/{budgetId}
- purpose: xem chi tiet
- response: { data: budget }

### PUT /api/budgets/{budgetId}
- purpose: cap nhat ngan sach
- request body: same as create (optional fields)
- response: { data: budget }

### DELETE /api/budgets/{budgetId}
- purpose: xoa ngan sach
- response: 204

## Notes
- Budget theo category, nhieu ngan sach trong 1 ky
- Budget theo vi, tinh spentAmount/remainingAmount tu giao dich chi phi trong ky
