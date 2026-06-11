# auth API (TO-BE)

## Base URL
/api

## Endpoints

### POST /api/auth/register
- purpose: dang ky
- request body: email, password, fullName
- response: { data: { message } }

### POST /api/auth/login
- purpose: dang nhap
- request body: email, password
- response: { data: { token, user } }

### POST /api/auth/logout
- purpose: dang xuat (client only)
- response: { data: { message } }

### POST /api/auth/change-password
- purpose: doi mat khau
- request body: currentPassword, newPassword
- response: { data: { message } }

### POST /api/auth/forgot-password
- purpose: gui email reset
- request body: email
- response: { data: { message } }

### POST /api/auth/reset-password
- purpose: reset mat khau
- request body: token, newPassword
- response: { data: { message } }

### POST /api/auth/verify-email
- purpose: xac thuc email
- request body: token
- response: { data: { message } }

### POST /api/auth/resend-verification
- purpose: gui lai email xac thuc
- request body: email
- response: { data: { message } }

### GET /api/auth/check-email
- purpose: kiem tra email ton tai
- query: email
- response: { data: { exists } }

## Notes
- Public endpoints
