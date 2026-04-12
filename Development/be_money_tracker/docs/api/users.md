# users API

## Base URL
/api

## Endpoints

### GET /api/users/me
- purpose: xem thong tin ca nhan
- response body:
  - userId (UUID)
  - email (string)
  - fullname (string)

### PUT /api/users/me
- purpose: cap nhat thong tin ca nhan
- request body:
  - fullname (string, optional)
- response body:
  - userId (UUID)
  - email (string)
  - fullname (string)

## Notes
- JWT required cho tat ca endpoint
