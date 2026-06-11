# category (TO-BE)

## 1. Purpose
Quan ly danh muc chi tieu.

## 2. Data Model
- categories: category_id, user_id (nullable), name, type, icon, color, is_default, is_hidden

## 3. Business Logic
- List category (default + user)
- Tao category
- Cap nhat category
- An category (is_hidden)

## 4. API
- GET /api/categories
- GET /api/categories/{categoryId}
- POST /api/categories
- PUT /api/categories/{categoryId}
- PATCH /api/categories/{categoryId}/hide

## 5. Flow
- categories-list-flow.md
- categories-create-flow.md
- categories-update-flow.md
- categories-hide-flow.md

## 6. Edge Cases
- Khong cho an category mac dinh

## 7. Notes
- is_hidden khac voi soft delete
