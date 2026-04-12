# category

## 1. Purpose
Cung cap category mac dinh va category do user tao cho transaction.

## 2. Data Model
- categories: category_id, user_id (nullable), name, type, icon, color, is_default, is_hidden

## 3. Business Logic
- List category user co quyen (default hoac cua user)
- Lay 1 category neu user co quyen truy cap
- Them category moi
- Cap nhat thong tin category
- An category (is_hidden)

## 4. API
- GET /api/categories
- GET /api/categories/{id}
- POST /api/categories
- PUT /api/categories/{id}
- PATCH /api/categories/{id}/hide

## 5. Flow
- categories-list-flow.md
- categories-create-flow.md
- categories-update-flow.md
- categories-hide-flow.md

## 6. Edge Cases
- Tu choi truy cap neu category khong thuoc user va khong phai default

## 7. Notes
- Category default cho tat ca, category user la rieng
