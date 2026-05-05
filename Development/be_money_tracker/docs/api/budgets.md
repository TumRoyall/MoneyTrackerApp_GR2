# budgets API

## Base URL
/api

## Endpoints

### POST /api/budgets
- purpose: tao ngan sach
- request body:
  - walletId (UUID, required)
  - categoryIds (array of UUID, required — at least one)
  - categoryId (UUID, optional, legacy single category for compatibility)
  - amountLimit (decimal)
  - periodStart (YYYY-MM-DD)
  - periodEnd (YYYY-MM-DD)
  - periodType (custom, monthly, weekly, biweekly, yearly)
  - alertThreshold (decimal, optional)
- response body:
  - budgetId (UUID)
  - walletId (UUID, required)
  - categoryIds (array of UUID)
  - categoryId (UUID, optional, legacy)
  - amountLimit (decimal)
  - periodStart (YYYY-MM-DD)
  - periodEnd (YYYY-MM-DD)
  - alertThreshold (decimal, optional)
  - spentAmount (decimal)
  - remainingAmount (decimal)

### GET /api/budgets
- purpose: lay danh sach ngan sach
- response: list of budgets

### GET /api/budgets/{budgetId}
- purpose: xem chi tiet ngan sach
- response: budget detail

### PUT /api/budgets/{budgetId}
- purpose: cap nhat ngan sach
- request body: same as create (optional fields)
- response: budget detail

### DELETE /api/budgets/{budgetId}
- purpose: xoa ngan sach
- response: 204 No Content

## Notes
- Ngan sach theo category, cho phep nhieu ngan sach trong 1 ky
- spentAmount/remainingAmount tinh theo giao dich chi phi trong khoang thoi gian cua budget, loc theo vi va category
