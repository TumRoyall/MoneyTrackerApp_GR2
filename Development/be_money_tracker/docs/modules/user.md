# user

## 1. Purpose
Dinh danh user va duoc dung boi cac module khac.

## 2. Data Model
- users: user_id, email, password_hash, provider, is_verified

## 3. Business Logic
- Du lieu user co the duoc cap nhat thong tin ca nhan
- Auth module xu ly dang ky/dang nhap

## 4. API
- GET /api/users/me
- PUT /api/users/me

## 5. Flow
- user-get-profile-flow.md
- user-update-profile-flow.md

## 6. Edge Cases
- N/A

## 7. Notes
- Se mo rong neu can quan ly profile sau nay
