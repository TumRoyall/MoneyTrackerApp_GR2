# Event Feature - Technical Specification

## 1. Overview

Event là một **entity riêng biệt** (không phải Wallet) cho phép nhiều người cùng theo dõi chi tiêu cho một sự kiện cụ thể (ví dụ: cầu lông Chủ Nhật, sinh nhật, company trip).

### Core Concept
- Event = Entity riêng, không liên quan đến Wallet
- Tất cả thành viên đều có thể thêm transaction
- Settlement tính fair share và tối ưu hóa số giao dịch chuyển tiền
- Event có life-cycle riêng: ACTIVE → SETTLED / ARCHIVED

---

## 2. Data Model

### 2.1 Event Entity

```java
@Entity
@Table(name = "events")
public class Event {
    @Id
    UUID eventId;

    @Column(nullable = false)
    String name;                          // Tên event

    @Column(length = 50)
    String icon;                          // Emoji/icon (VD: "🏸")

    @Column(columnDefinition = "TEXT")
    String description;                  // Mô tả

    @Enumerated(EnumType.STRING)
    @Column(name = "event_status", length = 20, nullable = false)
    EventStatus status;                  // ACTIVE | SETTLED | ARCHIVED

    @Column(name = "share_code", length = 10, unique = true)
    String shareCode;                     // Mã tham gia 6 ký tự (VD: "ABC123")

    @Column(name = "share_link", length = 255)
    String shareLink;                     // Link tham gia

    @Column(name = "start_date")
    Instant startDate;                   // Ngày bắt đầu (optional)

    @Column(name = "end_date")
    Instant endDate;                     // Ngày kết thúc (optional)

    @Column(name = "created_by", nullable = false)
    UUID createdBy;                      // User tạo event (owner)

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Column(name = "deleted_at")
    Instant deletedAt;

    @Version
    Long version;
}
```

### 2.2 EventStatus Enum

```java
public enum EventStatus {
    ACTIVE,      // Đang diễn ra, có thể thêm transaction
    SETTLED,     // Đã kết toán, chỉ đọc
    ARCHIVED     // Đã archive bởi owner, chỉ đọc
}
```

### 2.3 EventMember Entity

```java
@Entity
@Table(name = "event_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "user_id"})
})
public class EventMember {
    @Id
    UUID id;

    @Column(name = "event_id", nullable = false)
    UUID eventId;

    @Column(name = "user_id", nullable = false)
    UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    EventMemberRole role;                // OWNER | MEMBER

    @Column(name = "joined_at", nullable = false)
    Instant joinedAt;

    @Column(name = "invited_by")
    UUID invitedBy;                      // User mời (null nếu tự join)

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Column(name = "deleted_at")
    Instant deletedAt;

    @Version
    Long version;
}
```

### 2.4 EventMemberRole Enum

```java
public enum EventMemberRole {
    OWNER,    // Có toàn quyền: sửa event, xóa event, settle
    MEMBER    // Chỉ CRUD transaction của mình
}
```

### 2.5 EventTransaction Entity

```java
@Entity
@Table(name = "event_transactions")
public class EventTransaction {
    @Id
    @Column(nullable = false, updatable = false)
    UUID id;

    @Column(name = "event_id", nullable = false)
    UUID eventId;

    @Column(name = "created_by", nullable = false)
    UUID creatorId;                      // User tạo transaction

    @Column(name = "payer_id", nullable = false)
    UUID payerId;                        // User thực sự trả tiền

    @Column(precision = 18, scale = 2, nullable = false)
    BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    Category category;

    @Column(columnDefinition = "TEXT")
    String note;

    @Column(name = "tx_date", nullable = false)
    LocalDate date;

    @Column(name = "is_transfer_from_personal")
    Boolean isTransferFromPersonal;      // Có chuyển từ ví cá nhân?

    @Column(name = "personal_wallet_id")
    UUID personalWalletId;               // Ví nguồn nếu có transfer

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Column(name = "deleted_at")
    Instant deletedAt;

    @Version
    Long version;
}
```

---

## 3. API Endpoints

### 3.1 Event Management

```
POST   /api/events                    Tạo event mới
GET    /api/events                    Danh sách event của user
GET    /api/events/{eventId}          Chi tiết event
PUT    /api/events/{eventId}          Cập nhật event (owner only)
DELETE /api/events/{eventId}          Xóa event (owner only)
```

### 3.2 Event Participation

```
POST   /api/events/join                Tham gia event bằng code
POST   /api/events/{eventId}/leave    Rời event (không phải owner)
```

### 3.3 Members

```
GET    /api/events/{eventId}/members   Danh sách thành viên
```

### 3.4 Event Transactions

```
GET    /api/events/{eventId}/transactions        Danh sách transaction
POST   /api/events/{eventId}/transactions        Thêm transaction
PUT    /api/events/{eventId}/transactions/{txId} Sửa transaction (creator only)
DELETE /api/events/{eventId}/transactions/{txId} Xóa transaction (creator/owner)
```

### 3.5 Settlement

```
GET    /api/events/{eventId}/settlement          Xem kết toán
POST   /api/events/{eventId}/settle              Kết toán event (owner only)
```

---

## 4. Business Logic

### 4.1 Create Event

```
Input:
  - name: String (required)
  - icon: String (optional, default: "🎉")
  - description: String (optional)
  - startDate: Instant (optional)
  - endDate: Instant (optional)

Process:
  1. Generate 6-char unique shareCode (uppercase alphanumeric)
  2. shareLink = "https://moneytracker.app/e/" + shareCode
  3. Tạo event với status=ACTIVE, createdBy=currentUser
  4. Thêm creator vào event_members với role=OWNER

Output: EventResponse với shareCode, shareLink
```

### 4.2 Join Event

```
Input:
  - shareCode: String (6 chars)

Process:
  1. Tìm event theo shareCode (không deleted)
  2. Check event.status == ACTIVE
  3. Check user chưa là member
  4. Thêm user vào event_members với role=MEMBER

Output: EventResponse

Error cases:
  - Event not found → "Event not found"
  - Event not active → "Event is not active"
  - Already member → "Already a member of this event"
```

### 4.3 Add Transaction

```
Input:
  - amount: BigDecimal (required)
  - categoryId: UUID (required)
  - note: String (optional)
  - date: LocalDate (default: today)
  - payerId: UUID (default: currentUser)
  - isTransferFromPersonal: Boolean (default: false)
  - personalWalletId: UUID (nếu isTransferFromPersonal=true)

Process:
  1. Check user là member của event
  2. Check event.status == ACTIVE
  3. Nếu isTransferFromPersonal=true:
     a. Tạo TRANSFER transaction từ personalWallet
     b. Update wallet balance
  4. Tạo EventTransaction với:
     - eventId = current event
     - creatorId = currentUser
     - payerId = payerId (default: currentUser)

Output: List<EventTransactionResponse>
```

### 4.4 Settlement Algorithm

```
Input: eventId

Process:
  1. totalSpent = SUM(event_transactions.amount) WHERE eventId
  2. members = EventMember WHERE eventId AND deletedAt IS NULL
  3. memberCount = members.size()
  4. perPersonShare = totalSpent / memberCount

  5. Tính contribution theo payer:
     - contributions[userId] = SUM(amount) WHERE payerId = userId

  6. Tính balance:
     - balance[userId] = contribution[userId] - perPersonShare
     - balance > 0: user được hoàn tiền (creditor)
     - balance < 0: user đang nợ (debtor)
     - balance = 0: vừa đủ

  7. Optimize settlements (greedy algorithm):
     a. Sort creditors descending by balance
     b. Sort debtors ascending by balance (abs value)
     c. Match largest creditor with largest debtor
     d. Repeat until all balanced

Output: SettlementResponse
```

### 4.5 Settlement Optimization Example

```
Members: A, B, C, D, E, F (6 người)
Total spent: 1,200,000
Per person: 200,000

Contributions:
- A: 500,000 → balance: +300,000 (được hoàn)
- B: 300,000 → balance: +100,000 (được hoàn)
- C: 200,000 → balance: 0 (vừa đủ)
- D: 100,000 → balance: -100,000 (nợ)
- E: 50,000  → balance: -150,000 (nợ)
- F: 50,000  → balance: -150,000 (nợ)

Creditors: A(+300,000), B(+100,000)
Debtors: D(-100,000), E(-150,000), F(-150,000)

Step-by-step:
1. A(+300,000) → E(-150,000): A nhận 150,000
2. A(+150,000) → F(-150,000): A nhận 150,000
3. A(0) ← D(-100,000): D trả 100,000 cho A
4. B(+100,000) ← E(0): E trả nốt 50,000 cho B

Result (4 transactions):
- D → A: 100,000
- E → A: 100,000
- E → B: 50,000
- F → A: 100,000

(Thay vì 5 transactions nếu settle trực tiếp)
```

---

## 5. Request/Response Formats

### 5.1 Create Event Request

```json
POST /api/events
{
  "name": "Cầu lông Chủ Nhật",
  "icon": "🏸",
  "description": "Chơi cầu lông hàng tuần, chia tiền sân & cầu",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-30T00:00:00Z"
}
```

### 5.2 Create Event Response

```json
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "name": "Cầu lông Chủ Nhật",
    "icon": "🏸",
    "description": "Chơi cầu lông hàng tuần",
    "shareCode": "ABC123",
    "shareLink": "https://moneytracker.app/e/ABC123",
    "status": "ACTIVE",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-30T00:00:00Z",
    "createdBy": "user-uuid",
    "createdAt": "2024-06-01T00:00:00Z",
    "memberCount": 1,
    "totalSpent": 0,
    "transactionCount": 0
  }
}
```

### 5.3 Join Event Request

```json
POST /api/events/join
{
  "shareCode": "ABC123"
}
```

### 5.4 Add Transaction Request

```json
POST /api/events/{eventId}/transactions
{
  "amount": 200000,
  "categoryId": "category-uuid",
  "note": "Thuê sân cầu lông 2 tiếng",
  "date": "2024-06-02",
  "payerId": "user-uuid",  // Ai trả tiền, default = current user
  "isTransferFromPersonal": true,
  "personalWalletId": "wallet-uuid"
}
```

### 5.5 Add Transaction Response

```json
{
  "success": true,
  "data": [
    {
      "id": "tx-uuid",
      "eventId": "event-uuid",
      "creatorId": "user-uuid",
      "creatorName": "Ngọc",
      "payerId": "user-uuid",
      "payerName": "Ngọc",
      "amount": 200000,
      "categoryId": "category-uuid",
      "categoryName": "Thuê sân",
      "categoryIcon": "🎾",
      "note": "Thuê sân cầu lông 2 tiếng",
      "date": "2024-06-02",
      "isTransferFromPersonal": true,
      "personalWalletId": "wallet-uuid",
      "createdAt": "2024-06-02T10:30:00Z",
      "version": 1
    }
  ]
}
```

### 5.6 Settlement Response

```json
GET /api/events/{eventId}/settlement
{
  "success": true,
  "data": {
    "eventId": "event-uuid",
    "totalSpent": 1200000,
    "memberCount": 6,
    "perPersonShare": 200000,
    "memberBalances": [
      { "userId": "a-uuid", "userName": "Ngọc", "contribution": 500000, "balance": 300000 },
      { "userId": "b-uuid", "userName": "Tuấn", "contribution": 300000, "balance": 100000 },
      { "userId": "c-uuid", "userName": "Thanh", "contribution": 200000, "balance": 0 },
      { "userId": "d-uuid", "userName": "Minh", "contribution": 100000, "balance": -100000 },
      { "userId": "e-uuid", "userName": "An", "contribution": 50000, "balance": -150000 },
      { "userId": "f-uuid", "userName": "Hùng", "contribution": 50000, "balance": -150000 }
    ],
    "settlements": [
      { "fromUserId": "d-uuid", "fromUserName": "Minh", "toUserId": "a-uuid", "toUserName": "Ngọc", "amount": 100000 },
      { "fromUserId": "e-uuid", "fromUserName": "An", "toUserId": "a-uuid", "toUserName": "Ngọc", "amount": 100000 },
      { "fromUserId": "e-uuid", "fromUserName": "An", "toUserId": "b-uuid", "toUserName": "Tuấn", "amount": 50000 },
      { "fromUserId": "f-uuid", "fromUserName": "Hùng", "toUserId": "a-uuid", "toUserName": "Ngọc", "amount": 100000 }
    ]
  }
}
```

---

## 6. Security & Permissions

### 6.1 Permission Matrix

| Action | Owner | Member |
|--------|-------|--------|
| Xem event | ✅ | ✅ |
| Thêm transaction | ✅ | ✅ |
| Sửa transaction của mình | ✅ | ✅ |
| Xóa transaction của mình | ✅ | ✅ |
| Xóa transaction người khác | ✅ | ❌ |
| Sửa event info | ✅ | ❌ |
| Xóa event | ✅ | ❌ |
| Kết toán event | ✅ | ❌ |
| Rời event | ❌ | ✅ |

### 6.2 Share Code Security

- 6 ký tự alphanumeric = ~2 tỷ combinations
- Rate limit: 10 attempts/minute (implement ở phase sau)
- Event phải ACTIVE mới join được

---

## 7. Edge Cases

### 7.1 Concurrent Operations
- 2 user thêm transaction cùng lúc → optimistic locking (version field)
- Last-write-wins cho conflicts

### 7.2 Event với 1 thành viên
- Cho phép tạo (solo event)
- Settlement: 0 transactions needed

### 7.3 Event với nhiều thành viên (50+)
- Pagination cho member list
- Aggregate calculations vẫn nhanh

### 7.4 User xóa tài khoản
- Giữ displayName trong transactions
- Đánh dấu "former member"

### 7.5 Owner cố rời event
- Không cho phép
- Phải transfer ownership hoặc delete event

### 7.6 Settlement với pending sync
- Block settlement nếu có unsynced data
- Show warning để sync trước

---

## 8. Database Schema

```sql
-- ===== EVENT TABLE =====
CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    event_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    share_code VARCHAR(10) UNIQUE,
    share_link VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_events_share_code ON events(share_code);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_status ON events(event_status);

-- ===== EVENT_MEMBER TABLE =====
CREATE TABLE event_members (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    invited_by UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_members_event ON event_members(event_id);
CREATE INDEX idx_event_members_user ON event_members(user_id);

-- ===== EVENT_TRANSACTION TABLE =====
CREATE TABLE event_transactions (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    created_by UUID NOT NULL,
    payer_id UUID NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    category_id UUID NOT NULL,
    note TEXT,
    tx_date DATE NOT NULL,
    is_transfer_from_personal BOOLEAN DEFAULT FALSE,
    personal_wallet_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_event_tx_event ON event_transactions(event_id);
CREATE INDEX idx_event_tx_payer ON event_transactions(payer_id);
CREATE INDEX idx_event_tx_creator ON event_transactions(created_by);
CREATE INDEX idx_event_tx_date ON event_transactions(tx_date);
```

---

## 9. File Structure (Backend)

```
src/main/java/com/examples/moneytracker/event/
├── model/
│   ├── Event.java
│   ├── EventStatus.java
│   ├── EventMember.java
│   ├── EventMemberRole.java
│   └── EventTransaction.java
├── repository/
│   ├── EventRepository.java
│   ├── EventMemberRepository.java
│   └── EventTransactionRepository.java
├── dto/
│   ├── CreateEventRequest.java
│   ├── UpdateEventRequest.java
│   ├── EventResponse.java
│   ├── EventDetailResponse.java
│   ├── EventMemberResponse.java
│   ├── CreateEventTransactionRequest.java
│   ├── UpdateEventTransactionRequest.java
│   ├── EventTransactionResponse.java
│   └── JoinEventRequest.java
├── service/
│   └── EventService.java
└── controller/
    └── EventController.java
```

---

## 10. Implementation Phases

### Phase 1: MVP ✅
- [x] Create Event entity + CRUD
- [x] Generate share code
- [x] Join via code
- [x] Add transaction (với transfer option)
- [x] View event overview (members, transactions)
- [x] Settlement calculation + optimization

### Phase 2
- [ ] Settlement execution (mark as paid)
- [ ] Notification system
- [ ] Event history/archive

### Phase 3
- [ ] Guest support (web-based, stateless)
- [ ] Export (PDF/Excel)
- [ ] AI summary

---

## 11. Testing Checklist

- [ ] Create event với valid data
- [ ] Generate share code (verify uniqueness)
- [ ] Join với valid code
- [ ] Join với invalid code (should fail)
- [ ] Join settled event (should fail)
- [ ] Add transaction as owner
- [ ] Add transaction as member
- [ ] Add transaction với transfer
- [ ] Edit own transaction
- [ ] Edit others' transaction (should fail)
- [ ] Delete own transaction
- [ ] Delete others' transaction as owner
- [ ] Settlement calculation accuracy
- [ ] Settlement optimization (minimize transactions)
- [ ] Settle event (status change)
- [ ] Cannot add transaction after settle

---

## 12. Future Considerations

- Custom split (percentage/weighted)
- Recurring events
- Sub-events (multi-day trips)
- Payment integration (VNPay, MoMo)
- Real-time sync với WebSocket