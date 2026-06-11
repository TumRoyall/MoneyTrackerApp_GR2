# users API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/users/me
- purpose: xem thong tin ca nhan
- response: { data: user }

### PUT /api/users/me
- purpose: cap nhat thong tin ca nhan
- request body:
  - fullName (optional)
- response: { data: user }

## Notes
- JWT required
