# Decision Log

## 2026-04-08

### Decision
- Dung UUID cho tat ca ID (PK/FK)
- Scope hien tai: auth, user, wallet, category, transaction
- Sync la planned, chua chinh thuc
- Base URL cua API la /api

### Reason
- Dong bo docs voi pham vi hien tai va thong nhat quy uoc

### Impact
- Database va API docs phai theo UUID va /api
- Sync tables duoc mo ta nhung chua bat buoc cho ban hien tai

### Update
- Budget theo category, cho phep nhieu ngan sach trong 1 ky
- Ky co the la khoang thoi gian tuy chon hoac theo thang
- Report can co: tong thu nhap, tong chi tieu, net, so giao dich, top category, top wallet
- Backup luu cloud, export JSON, khong ma hoa
- Logout chi can tren client
- Category hide dung is_hidden
- API wallet su dung /api/wallets

## [YYYY-MM-DD]

### Decision
Mô tả quyết định

### Reason
Tại sao chọn

### Impact
Ảnh hưởng gì