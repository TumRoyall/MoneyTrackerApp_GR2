# budget

## 1. Purpose
Quan ly ngan sach chi tieu va canh bao vuot nguong.

## 2. Data Model
- budgets: budget_id, user_id, category_id, amount_limit, period_start, period_end, period_type, alert_threshold

## 3. Business Logic
- Thiet lap ngan sach
- Ngan sach theo category (khong co ngan sach tong)
- Cho phep nhieu ngan sach trong 1 ky
- Ky co the la khoang thoi gian do user dat ra hoac theo thang (custom/monthly)
- Thiet lap canh bao (extend)
- Chinh sua thong tin ngan sach
- Xoa ngan sach

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
- Ngan sach trung lap theo cung ky
- Cap nhat/xoa ngan sach khong thuoc user

## 7. Notes
- Ngan sach theo category, cho phep nhieu ngan sach trong 1 ky
