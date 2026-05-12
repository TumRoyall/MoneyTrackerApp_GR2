# debts API

## Base URL
/api

## Authentication
- All endpoints require an authenticated user.
- The controller uses `@AuthenticationPrincipal CustomUserDetails` to resolve the current user.

## Endpoints

### POST /api/debts
- purpose: tạo món nợ (tự động tạo wallet type `DEBT`)
- request body:
  - title (string, required)
  - targetAmount (decimal, required)
  - currency (string, required)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
- response body:
  - debtId (UUID)
  - walletId (UUID)
  - walletName (string)
  - currency (string)
  - currentBalance (decimal)
  - title (string)
  - targetAmount (decimal)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
  - createdAt (timestamp)
  - updatedAt (timestamp)

### GET /api/debts
- purpose: lấy danh sách món nợ của người dùng hiện tại
- response: list of `DebtResponse`

### GET /api/debts/{debtId}
- purpose: xem chi tiết món nợ
- response: `DebtResponse`

### PUT /api/debts/{debtId}
- purpose: cập nhật món nợ
- request body:
  - title (string, optional)
  - targetAmount (decimal, optional)
  - startDate (YYYY-MM-DD, optional)
  - targetDate (YYYY-MM-DD, optional)
- response: `DebtResponse`

### DELETE /api/debts/{debtId}
- purpose: xóa món nợ
- response: `204 No Content`

## Notes
- Món nợ được lưu dưới dạng wallet có type `DEBT`.
- `currentBalance` là số dư của wallet DEBT và phản ánh giao dịch thanh toán nợ.
- Thanh toán nợ không có endpoint riêng; nó được thực hiện bằng giao dịch `INCOME`/`EXPENSE` trên wallet DEBT.
- Xóa món nợ là xóa mềm (soft delete) - bản ghi vẫn giữ `deletedAt` thay vì xóa hoàn toàn.
