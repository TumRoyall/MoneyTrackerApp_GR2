# Flows: Event

## Flow 1: Khách vào event qua link → tự động tham gia

```
[Guest mở link web] /guest/{eventId}
        │
        ▼
[Web form] Nhập tên + email + số tiền + danh mục
        │
        ▼
[POST /api/events/{eventId}/guest-transactions]
        │
        ▼
[Backend]
  1. Validate body
  2. Tìm member theo (event_id, guest_email)
     ├─ Không có → Tạo mới EventMember(role=MEMBER, guest_name, guest_email)
     └─ Có rồi → Update guest_name nếu khác
  3. Lưu transaction (created_by=null, copy guest_name + guest_email)
        │
        ▼
[Trả 200 OK]
        │
        ▼
[Web hiển thị "Đã ghi nhận"] → Quay về danh sách
        │
        ▼
[Owner mở app, reload members list]
  → Thấy guest xuất hiện trong danh sách thành viên
```

## Flow 2: Owner quản lý thành viên

```
[Owner mở Event Detail screen]
        │
        ▼
[Bấm icon 👥 trên header]
        │
        ▼
[Modal "Quản lý thành viên" mở]
        │
        ├─── Thêm ────────────────────────┐
        │ [Bấm + Thêm thành viên]         │
        │ [Modal con: Nhập Tên + Email]    │
        │ [POST /api/events/{id}/members]  │
        │   └─ 200: thêm vào list          │
        │   └─ 400 MEMBER_EMAIL_DUPLICATE  │
        │       → Alert "Email đã dùng"   │
        │                                  │
        ├─── Sửa ────────────────────────┐│
        │ [Bấm icon ✏️ trên row]          ││
        │ [Modal con: Sửa tên + role]     ││
        │ [PUT /api/events/{id}/members/{memberId}]
        │   └─ 200: cập nhật row          ││
        │   └─ 400 OWNER_CANNOT_DEMOTE_SELF│
        │                                  │
        └─── Xoá ────────────────────────┐│
            [Bấm icon 🗑️ trên row]        ││
            [Confirm dialog]              ││
            [DELETE /api/events/{id}/members/{memberId}]
              └─ 204: xoá row            ││
              └─ 400 OWNER_CANNOT_REMOVE_SELF
                                         ││
            ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
[Đóng modal → invalidate query]
```

## Flow 3: Owner kết toán — chọn "Chia đều (kể cả khách)"

```
[Owner bấm icon 🧮 trên header]
        │
        ▼
[Modal "Kết toán sự kiện" mở]
  - Hiển thị Tổng chi
  - 2 card chọn chế độ:
      [📊 Chia đều (kể cả khách)]
      [📋 Kết toán tối ưu (backend)]
  - Button [Hoàn thành kết toán] (chỉ khi ACTIVE)
        │
        ▼ [Bấm card Chia đều]
[Modal "Chia đều" mở]
        │
        ▼
[Frontend tính toán real-time qua useMemo]
  - Lấy members + transactions từ cache
  - buildEqualSplitParticipants:
      Với mỗi member: paid = sum(transactions.amount WHERE ...)
      Bỏ qua member có paid=0 và received=0
  - calculateEqualSplit:
      perPersonShare = totalSpent / participantCount
      net = paid - received - share
      Greedy match creditors ↔ debtors → transfers[]
        │
        ▼
[UI hiển thị]
  ┌─────────────────────────────┐
  │ Tổng chi: 5.000.000đ        │
  │ Mỗi người: 625.000đ        │
  ├─────────────────────────────┤
  │ 👤 Nguyễn A (Bạn, OWNER)    │
  │   Đã chi: 1.500.000đ (auto) │
  │   Đã nhận: [0]đ ← editable  │
  │   → +875.000đ 🟢            │
  │ ...                          │
  ├─────────────────────────────┤
  │ Lệnh chuyển:                 │
  │   Trần B → Nguyễn A: 325k  │
  │   Hùng → Nguyễn A: 425k    │
  ├─────────────────────────────┤
  │ [📋 Copy báo cáo]            │
  └─────────────────────────────┘
        │
        ▼ [User sửa "Đã nhận" = 200.000đ của Nguyễn A]
[useMemo re-calc]
  - net(Nguyễn A) = 1.500k - 200k - 625k = +675k
  - Transfer list update real-time
        │
        ▼ [Bấm Copy báo cáo]
[Clipboard.setStringAsync(formatEqualSplitReport(...))]
[Alert "Đã copy"]
```

## Flow 4: Owner hoàn thành kết toán (backend)

```
[Owner bấm "Hoàn thành kết toán"]
        │
        ▼
[Confirm dialog "Bạn có chắc chắn?"]
        │
        ▼ [OK]
[POST /api/events/{eventId}/settle]
        │
        ▼
[Backend] EventService.settleEvent:
  1. Validate OWNER
  2. Set event.status = SETTLED
  3. Tính settlement cuối cùng
  4. Trả SettlementResponse
        │
        ▼
[Client]
  - invalidate query 'event'
  - Alert "Sự kiện đã được kết toán"
  - Đóng modal
  - FAB đổi từ [+] → [📋] (copy report)
```

## Permission matrix

| Action | OWNER | MEMBER | Guest | Non-member |
|--------|-------|--------|-------|------------|
| Xem event | ✅ | ✅ | ✅ (qua guest-info) | ❌ |
| Xem members | ✅ | ✅ | ✅ (public) | ❌ |
| CRUD members | ✅ | ❌ | ❌ | ❌ |
| CRUD transaction của mình | ✅ | ✅ | ❌ (chỉ qua guest endpoint) | ❌ |
| CRUD transaction của người khác | ✅ | ❌ | ❌ | ❌ |
| Xem settlement backend | ✅ | ✅ | ❌ | ❌ |
| Settle event | ✅ | ❌ | ❌ | ❌ |
| Xem equal-split modal | ✅ | ✅ | ❌ | ❌ |