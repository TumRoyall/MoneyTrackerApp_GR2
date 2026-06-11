# auth (TO-BE)

## 1. Purpose
Dang ky, dang nhap, dang xuat, doi/quen/reset mat khau, xac thuc email.

## 2. Data Model
- users
- verification_token
- reset_password_token
- reset_password_sent_at

## 3. Business Logic
- Register
- Login
- Logout (client only)
- Change password
- Forgot password
- Reset password
- Verify email
- Resend verification

## 4. API
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/verify-email
- POST /api/auth/resend-verification
- GET /api/auth/check-email

## 5. Flow
- auth-register-flow.md
- auth-login-flow.md
- auth-logout-flow.md
- auth-change-password-flow.md
- auth-forgot-password-flow.md
- auth-reset-password-flow.md
- auth-verify-email-flow.md
- auth-resend-verification-flow.md

## 6. Edge Cases
- Email da ton tai
- Token het han

## 7. Notes
- Logout chi can tren client
