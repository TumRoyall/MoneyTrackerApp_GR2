# auth API

## Base URL
/api

## Endpoints

### POST /api/auth/register
- purpose: dang ky user va gui email xac thuc
- request body:
  - email (string)
  - password (string)
  - fullname (string)
- response:
  - message string

### POST /api/auth/login
- purpose: dang nhap va lay JWT
- request body:
  - email (string)
  - password (string)
- response body (AuthResponse):
  - token (string)
  - userId (UUID)
  - email (string)
  - fullname (string)

### POST /api/auth/logout
- purpose: dang xuat (huy phien neu co)
- response:
  - message string

### POST /api/auth/change-password
- purpose: doi mat khau
- request body:
  - currentPassword (string)
  - newPassword (string)
- response:
  - message string

### POST /api/auth/forgot-password
- purpose: gui email reset mat khau
- request body:
  - email (string)
- response:
  - message string

### POST /api/auth/reset-password
- purpose: reset mat khau bang token
- request body:
  - token (string)
  - newPassword (string)
- response:
  - message string

### GET /api/auth/verify-email
- purpose: xac thuc email bang token
- query:
  - token (string)
- response:
  - message string

### POST /api/auth/resend-verification
- purpose: gui lai email xac thuc
- request body:
  - email (string)
- response:
  - message string

### GET /api/auth/check-email
- purpose: kiem tra email da ton tai chua
- query:
  - email (string)
- response:
  - exists (boolean)
  - message (optional when exists = true)

## Notes
- Public endpoints (khong can JWT)
