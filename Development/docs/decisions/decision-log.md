# Decision Log

Ghi lại các quyết định kiến trúc / thiết kế quan trọng của dự án MoneyTracker.

---

## ADR-007: Email làm identifier cho Guest

**Ngày**: 2026-06-25
**Trạng thái**: Accepted

### Context

Khi khách tham gia event qua link ngoài (`/guest/{eventId}`) và tạo transaction, hệ thống cần 1 cách để:
1. Identify duy nhất mỗi khách trong cùng event (tránh 2 khách tên giống nhau bị gộp nhầm).
2. Auto-promote khách thành member.
3. Tránh "rác user" — cùng 1 người tạo nhiều transaction với tên viết khác nhau.

Các lựa chọn:
- **A. Email** — nhập email khi tạo transaction.
- **B. Số điện thoại** — nhập SĐT.
- **C. Tên tự do** + check trùng — đơn giản nhất nhưng dễ trùng/rác.
- **D. UUID random sinh ra từ server** — client không biết trước.

### Decision

Chọn **A. Email**.

### Consequences

**Tích cực**:
- Đơn giản, không cần OTP verify.
- Format rõ ràng, validate được bằng regex.
- Thực tế: khách (vd: bạn bè, đồng nghiệp) đã có sẵn email → giảm friction.

**Tiêu cực**:
- Khách có thể nhập email không tồn tại → không verify được.
- Có thể spam nếu không rate-limit (TODO).
- Người dùng kỹ thuật có thể thấy "lạ" khi bị yêu cầu email cho giao dịch nhỏ.

**Mitigation**:
- Validate format email.
- Rate-limit theo IP (TODO).
- Có thể thêm verify OTP sau (out of scope này).

---

## ADR-008: Auto-promote guest khi tạo transaction

**Ngày**: 2026-06-25
**Trạng thái**: Accepted

### Context

Khi khách vào event qua link, hiện tại họ chỉ có thể tạo transaction. Hệ thống nên:
- **Option 1**: Yêu cầu khách "tham gia event" qua form riêng trước khi tạo transaction.
- **Option 2**: Tự động thêm khách vào members khi họ tạo transaction đầu tiên.

### Decision

Chọn **Option 2: Auto-promote**.

Quy tắc:
- Khi `POST /api/events/{eventId}/guest-transactions`:
  1. Tìm `EventMember` theo `(event_id, guest_email)`.
  2. Không có → tạo mới với `role=MEMBER`, `guest_name` + `guest_email`.
  3. Có rồi → cập nhật `guest_name` nếu khác, giữ nguyên `id` + `joined_at`.
  4. Lưu transaction với `created_by=null`, copy `guest_name` + `guest_email`.

### Consequences

**Tích cực**:
- Giảm friction cho khách: 1 bước (nhập transaction) thay vì 2 (join + transaction).
- Khớp với hành vi tự nhiên: khách muốn ghi nhận chi tiêu, không phải điền form "tham gia".
- `guest_email` đóng vai trò identifier duy nhất (xem ADR-007).

**Tiêu cực**:
- Khách không chủ động "tham gia" → có thể không hiểu họ đã là member.
- Tạo nhiều member rác nếu có spam (mitigation: rate-limit).

**Mitigation**:
- Web form giải thích: "Email của bạn sẽ được dùng để theo dõi các giao dịch trong event này".
- Owner có thể xoá member rác qua modal "Quản lý thành viên" (xem `docs/api/event.md`).

---

## ADR-009: Member count = Tổng member (user + guest) trong Equal-Split

**Ngày**: 2026-06-25
**Trạng thái**: Accepted

### Context

Trong mode **Chia đều (kể cả khách)**, cần quyết định:
- **Lựa chọn A**: Chỉ tính cho member đã có transaction (active participants).
- **Lựa chọn B**: Tính cho tất cả member trong event (kể cả chưa có transaction).
- **Lựa chọn C**: Cho user chỉnh sửa số người tham gia.

### Decision

Chọn **A**: Chỉ tính cho member đã có ít nhất 1 transaction (paid > 0 hoặc received > 0).

### Consequences

**Tích cực**:
- Khớp với kỳ vọng: "ai chi thì chia" → không phạt người chưa tham gia.
- Không cần UI chỉnh sửa phức tạp.
- Số liệu tự động cập nhật khi có thêm transaction mới.

**Tiêu cực**:
- Nếu event có nhiều member "mời" nhưng chưa ai chi → không tính được (edge case).
- Member có thể "tránh" bằng cách không tạo transaction → nhưng thực tế họ sẽ phải trả phần của mình (admin xử lý ngoài app).

**Note**: `perPersonShare = totalSpent / activeMemberCount`. Member count là auto, không cho chỉnh tay.