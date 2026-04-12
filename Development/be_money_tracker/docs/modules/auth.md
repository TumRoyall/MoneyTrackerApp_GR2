# auth

## 1. Purpose
Xu ly dang ky, dang nhap, dang xuat, doi/quen mat khau, xac thuc email va cap JWT.

## 2. Data Model
- users: email, password_hash, provider, is_verified, verification_token, verification_sent_at

## 3. Business Logic
- Register: tao user, tao token xac thuc, gui email xac thuc
- Login: kiem tra mat khau, cap JWT
- Logout: huy token phien (neu co)
- Change password: xac thuc mat khau cu, cap nhat mat khau moi
- Forgot password: gui link/dat token reset
- Reset password: xac thuc token reset, cap nhat mat khau
- Verify email: danh dau da xac thuc, xoa token
- Resend verification: rate limit 60s, tao token moi

## 4. API
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/verify
- POST /api/auth/resend
- GET /api/auth/check-email

## 5. Flow
- auth-register-flow.md
- auth-login-flow.md
- auth-logout-flow.md
- auth-change-password-flow.md
- auth-forgot-password-flow.md
- auth-reset-password-flow.md
- auth-verify-email-flow.md

## 6. Edge Cases
- Email da ton tai
- Token khong hop le hoac het han
- Gui lai qua som

## 7. Notes
- JWT dung cho cac endpoint can bao ve
