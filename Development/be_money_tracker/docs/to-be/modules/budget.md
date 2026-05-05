# budget (TO-BE)

## 1. Purpose
Quan ly ngan sach theo category.

## 2. Data Model
- budgets: budget_id, user_id, wallet_id, category_id, amount_limit, period_start, period_end, period_type, alert_threshold

## 3. Business Logic
- Tao ngan sach theo category
- Budget bat buoc theo vi
- Nhieu ngan sach trong 1 ky
- Ky co the la custom hoac monthly
- Cap nhat ngan sach
- Xoa ngan sach
- Thiet lap canh bao

## 4. API
- POST /api/budgets
- GET /api/budgets
- GET /api/budgets/{budgetId}
- PUT /api/budgets/{budgetId}
- DELETE /api/budgets/{budgetId}

## 5. Flow
- budgets-create-flow.md
- budgets-update-flow.md
- budgets-delete-flow.md
- budgets-alert-flow.md

## 6. Edge Cases
- Trung ngan sach trong cung ky

## 7. Notes
- Budget bat buoc theo category
