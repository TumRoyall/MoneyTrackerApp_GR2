# API: Event

Base URL: `/api/events`

Tất cả endpoint (trừ guest) yêu cầu JWT Bearer token trong header `Authorization: Bearer <token>`.

## Cấu trúc response

```json
{
  "data": <T>,
  "meta": { "page": 1, "size": 20, "total": 0, "totalPages": 0 }
}
```

Lỗi:
```json
{
  "error": {
    "code": "MEMBER_EMAIL_DUPLICATE",
    "message": "Email này đã được sử dụng trong event",
    "details": { "email": "a@b.com" }
  }
}
```

---

## Event CRUD

### `POST /api/events` — Tạo event

**Auth**: User

**Body** (`CreateEventRequest`):
```json
{
  "name": "Cầu lông Chủ Nhật",
  "icon": "🏸",
  "description": "Mỗi tuần",
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-06-30T23:59:59Z"
}
```

**Response 200**: `EventResponse`

---

### `GET /api/events` — Danh sách event của user hiện tại

**Auth**: User

**Response 200**: `EventResponse[]`

---

### `GET /api/events/{eventId}` — Chi tiết event

**Auth**: User (phải là member)

**Response 200**: `EventDetailResponse`

---

### `PUT /api/events/{eventId}` — Cập nhật event

**Auth**: OWNER

**Body**: `UpdateEventRequest` (giống `CreateEventRequest` nhưng tất cả field optional)

---

### `DELETE /api/events/{eventId}` — Xoá event

**Auth**: OWNER

**Response**: 204 No Content

---

## Join / Leave

### `POST /api/events/join` — Tham gia bằng share code

**Auth**: User

**Body**:
```json
{ "shareCode": "ABC123" }
```

---

### `POST /api/events/{eventId}/leave` — Rời event

**Auth**: User (là member)

**Response**: 204 No Content

---

## Members

### `GET /api/events/{eventId}/members` — Danh sách thành viên

**Auth**: User (là member)

**Response 200**: `EventMemberResponse[]`

`EventMemberResponse`:
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",            // null nếu là guest
  "displayName": "Nguyễn A",   // user.displayName hoặc guest_name
  "guestName": "Hùng",         // null nếu là user
  "guestEmail": "hung@x.com",  // null nếu là user
  "avatarUrl": "...",
  "role": "OWNER" | "MEMBER",
  "isOwner": false,
  "isGuest": true,
  "joinedAt": "2026-06-25T10:00:00Z",
  "contribution": 1500000,
  "transactionCount": 3,
  "balance": 875000
}
```

---

### `POST /api/events/{eventId}/members` — Thêm thành viên (OWNER only)

**Auth**: OWNER của event

**Body** (`AddMemberRequest`):
```json
{
  "guestName": "Hùng",
  "guestEmail": "hung@x.com"
}
```

**Validation**:
- `guestName`: NotBlank, max 100 ký tự
- `guestEmail`: NotBlank, Email format

**Response 200**: `EventMemberResponse`

**Errors**:
- `400 MEMBER_EMAIL_DUPLICATE`: Email đã tồn tại trong event này
- `403 FORBIDDEN`: Không phải OWNER
- `404 EVENT_NOT_FOUND`: Event không tồn tại

---

### `PUT /api/events/{eventId}/members/{memberId}` — Sửa thành viên (OWNER only)

**Auth**: OWNER

**Body** (`UpdateMemberRequest`):
```json
{
  "displayName": "Hùng Nguyễn",   // optional, đổi tên hiển thị
  "role": "MEMBER"                // optional, OWNER hoặc MEMBER
}
```

**Response 200**: `EventMemberResponse`

**Errors**:
- `400 OWNER_CANNOT_DEMOTE_SELF`: OWNER không thể tự hạ role
- `403 FORBIDDEN`
- `404 MEMBER_NOT_FOUND`

---

### `DELETE /api/events/{eventId}/members/{memberId}` — Xoá thành viên (OWNER only)

**Auth**: OWNER

**Response**: 204 No Content

**Errors**:
- `400 OWNER_CANNOT_REMOVE_SELF`: OWNER không thể tự xoá
- `403 FORBIDDEN`
- `404 MEMBER_NOT_FOUND`

**Note**: Soft-delete. Transactions của member vẫn còn để giữ lịch sử.

---

## Transactions

### `GET /api/events/{eventId}/transactions`

**Auth**: User (member)

**Response 200**: `EventTransactionResponse[]`

---

### `POST /api/events/{eventId}/transactions` — Thêm giao dịch (user)

**Auth**: User (member)

**Body** (`CreateEventTransactionRequest`):
```json
{
  "amount": 500000,
  "categoryId": "uuid",
  "note": "Tiền sân",
  "date": "2026-06-25",
  "walletId": "uuid"
}
```

---

### `POST /api/events/{eventId}/guest-transactions` — Thêm giao dịch (guest)

**Auth**: Public (qua link guest, dùng eventId)

**Body** (`CreateGuestTransactionRequest`):
```json
{
  "guestName": "Hùng",
  "guestEmail": "hung@x.com",     // BẮT BUỘC (mới)
  "amount": 200000,
  "categoryId": "uuid",
  "categoryName": "Ăn uống",
  "categoryIcon": "food",
  "note": "Nước",
  "date": "2026-06-25"
}
```

**Behavior**:
- Auto-create hoặc update member theo `guestEmail` (xem `docs/modules/event.md`).
- Lưu transaction với `created_by = null`, copy `guest_name` + `guest_email`.

---

### `PUT /api/events/{eventId}/transactions/{transactionId}` — Sửa

**Auth**: OWNER hoặc người tạo transaction

---

### `DELETE /api/events/{eventId}/transactions/{transactionId}` — Xoá

**Auth**: OWNER hoặc người tạo

---

## Settlement

### `GET /api/events/{eventId}/settlement` — Tính toán kết toán (backend, chỉ user)

**Auth**: User (member)

**Response 200**:
```json
{
  "data": {
    "eventId": "uuid",
    "totalSpent": 5000000,
    "memberCount": 5,
    "perPersonShare": 1000000,
    "memberBalances": [...],
    "settlements": [
      { "fromUserId": "...", "fromUserName": "Trần B", "toUserId": "...", "toUserName": "Nguyễn A", "amount": 300000 }
    ]
  }
}
```

**Note**: Tính cho user thật. Guest không xuất hiện ở đây (xem `equalSplit` ở frontend).

---

### `POST /api/events/{eventId}/settle` — Hoàn thành kết toán

**Auth**: OWNER

**Response 200**: `SettlementResponse` (giống GET)

---

## Error codes

| Code | HTTP | Mô tả |
|------|------|--------|
| `EVENT_NOT_FOUND` | 404 | Event không tồn tại |
| `MEMBER_NOT_FOUND` | 404 | Member không tồn tại |
| `MEMBER_EMAIL_DUPLICATE` | 400 | Email trùng trong cùng event |
| `OWNER_CANNOT_REMOVE_SELF` | 400 | OWNER không thể tự xoá |
| `OWNER_CANNOT_DEMOTE_SELF` | 400 | OWNER không thể tự hạ role |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `VALIDATION_ERROR` | 400 | Body không hợp lệ |