# savings API

## Base URL
/api

## Endpoints

### POST /api/savings
- purpose: tao muc tieu tiet kiem (tu dong tao vi SAVING)
- request body:
  - title (string, required)
  - targetAmount (decimal, required)
  - currency (string, required)
  - type (one_time, periodic) (required)
  - periodUnit (monthly, yearly) (required khi type = periodic)
  - startPeriod (YYYY-MM-DD, optional)
- response body:
  - savingId (UUID)
  - walletId (UUID)
  - walletName (string)
  - currency (string)
  - currentBalance (decimal)
  - title (string)
  - targetAmount (decimal)
  - type (one_time, periodic)
  - periodUnit (monthly, yearly, optional)
  - startPeriod (YYYY-MM-DD, optional)
  - createdAt, updatedAt (timestamp)

### GET /api/savings
- purpose: lay danh sach muc tieu tiet kiem
- response: list of SavingResponse

### GET /api/savings/{savingId}
- purpose: xem chi tiet muc tieu tiet kiem
- response: SavingResponse

### PUT /api/savings/{savingId}
- purpose: cap nhat muc tieu tiet kiem
- request body:
  - title (string, optional)
  - targetAmount (decimal, optional)
  - type (one_time, periodic, optional)
  - periodUnit (monthly, yearly, optional)
  - startPeriod (YYYY-MM-DD, optional)
- response: SavingResponse

### DELETE /api/savings/{savingId}
- purpose: xoa muc tieu tiet kiem (soft delete) va dong bo xoa vi SAVING
- response: 204 No Content

## Notes
- Tiet kiem la 1 wallet type SAVING
- Tien tiet kiem lay tu giao dich INCOME/EXPENSE trong wallet SAVING
