# Module: Event (Shared Expense)

## Tổng quan

Module Event cho phép nhóm người theo dõi chi tiêu chung cho một sự kiện (vd: tiệc sinh nhật, đi du lịch nhóm, buổi chơi cầu lông, dự án công ty). Mỗi event có danh sách thành viên, danh sách giao dịch, và có thể được kết toán (settlement) khi kết thúc.

## ERD

```
events
├── event_id (PK, UUID)
├── name
├── icon
├── description
├── event_status (ACTIVE / SETTLED / ARCHIVED)
├── share_code (unique, 6 ký tự)
├── share_link
├── start_date, end_date
├── created_by (user_id)
├── created_at, updated_at, deleted_at
└── version

event_members
├── id (PK, UUID)
├── event_id (FK → events)
├── user_id (FK → users, nullable)        -- null nếu là guest
├── guest_name                             -- tên hiển thị cho guest
├── guest_email (nullable)                 -- identifier duy nhất cho guest trong event
├── role (OWNER / MEMBER)
├── joined_at
├── invited_by (user_id, nullable)
├── created_at, updated_at, deleted_at
└── version
UNIQUE (event_id, user_id)
UNIQUE (event_id, guest_email)

transactions (shared)
├── transaction_id (PK)
├── wallet_id (FK, nullable nếu guest)
├── created_by (user_id, nullable nếu guest)
├── event_id (FK → events, nullable)
├── guest_name
├── guest_email (nullable, mới)
├── category_id
├── amount
├── type (EXPENSE / INCOME)
├── note, date
└── ...
```

## Quy tắc nghiệp vụ

### Member

- Một event có ít nhất 1 OWNER (người tạo event).
- Member là **user thật** khi có `user_id` (không có `guest_email`).
- Member là **guest** khi có `guest_email` (không có `user_id`).
- Trong cùng event, **1 user_id = 1 member** và **1 guest_email = 1 member**.
- Guest email không cần verify OTP (xem ADR-007).
- OWNER có quyền CRUD tất cả member khác; MEMBER chỉ có quyền CRUD transaction của chính mình.
- OWNER không thể tự xoá mình (phải transfer ownership — TODO ngoài scope này).

### Auto-promote guest

Khi guest tạo transaction qua endpoint `POST /api/events/{eventId}/guest-transactions`:

1. Hệ thống lookup `EventMember` theo `(event_id, guest_email)`.
2. **Nếu không tìm thấy** → tự động tạo member mới với `role = MEMBER`, lưu `guest_name` và `guest_email` từ request.
3. **Nếu đã tồn tại** → cập nhật `guest_name` nếu khác (giữ nguyên `id`, `joined_at`).
4. Lưu transaction với `created_by = null`, copy `guest_name` và `guest_email`.

### Settlement

Hiện có 2 chế độ kết toán (xem `docs/flows/event-flow.md`):

1. **Kết toán tối ưu (backend)** — endpoint `/api/events/{eventId}/settlement` hiện có. Chỉ tính cho user thật (có `user_id`).
2. **Chia đều (frontend, mới)** — tính toán ngay trên client, bao gồm cả guest. Mỗi người có 2 ô:
   - **Đã chi** (paid): auto-fill từ contribution, user có thể sửa.
   - **Đã nhận** (received): mặc định 0, user tự nhập (vd: thù lao, ứng trước).

## Edge cases

| Tình huống | Xử lý |
|------------|--------|
| 2 transaction cùng guest_email | Gộp vào 1 member, không tạo trùng |
| Guest đổi tên qua update | Update `guest_name`, giữ nguyên `id` và `joined_at` |
| Add member với email trùng event khác | Không conflict vì unique theo `(event_id, guest_email)` |
| Add member với email trùng cùng event | Trả 400 với message "Email đã được sử dụng trong event này" |
| OWNER remove chính mình | Trả 400 với message "Không thể xoá OWNER. Hãy chuyển quyền trước" |
| Non-OWNER gọi API CRUD member | Trả 403 Forbidden |
| Member bị remove nhưng có transaction cũ | Soft-delete member; transactions giữ nguyên, hiển thị "Đã rời" |
| Event ở trạng thái SETTLED | Vẫn cho xem members nhưng không cho CRUD |

## Liên kết

- API: [docs/api/event.md](../api/event.md)
- Flows: [docs/flows/event-flow.md](../flows/event-flow.md)
- Decisions: [docs/decisions/decision-log.md](../decisions/decision-log.md)