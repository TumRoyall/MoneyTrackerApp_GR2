# Design: AI-Powered Smart Budgeting

**Date:** 2026-06-05
**Status:** Draft (For Review)
**Type:** Feature Design
**Scope:** Reference / Brainstorm only - not yet committed to implementation

## Overview

Cho phép người dùng tạo ngân sách hàng tháng bằng AI. User khai báo thu nhập thực tế + text mô tả nhu cầu, hệ thống gọi Gemini để sinh draft budget (4-6 categories), user xem preview + chỉnh slider → bấm xác nhận → lưu batch vào DB.

## Giải quyết vấn đề

- **Cold start:** User mới không biết lập budget thế nào → AI gợi ý theo profile + lịch sử
- **Cá nhân hóa:** Không dùng mô hình cứng nhắc (50/30/20), AI điều chỉnh theo income type + goal
- **Tiết kiệm thời gian:** Không phải tự tính %, tự tạo từng category

---

## Scope: 3 Features tách biệt (Option A)

Tách thành **3 features độc lập**, ship theo thứ tự ưu tiên. Mỗi feature có design riêng, có thể hủy bỏ nếu feedback xấu.

| # | Feature | Mục đích | Effort | Phụ thuộc |
|---|---------|----------|--------|-----------|
| **F1** | **Slider Component cho Budget** | Thanh kéo điều chỉnh amount (dùng cho cả manual + AI) | Nhỏ (~1 tuần) | Không |
| **F2** | **AI Budget Generation** | Gọi Gemini sinh draft budget, dùng slider từ F1 | Trung bình (~2-3 tuần) | F1 (UX) |
| **F3** | **User Onboarding (3 câu hỏi)** | Thu thập profile cho future AI features | Trung bình (~1-2 tuần) | Độc lập |

**Thứ tự ship:** F1 → F2 → F3 (F3 có thể song song với F1/F2)

### Tại sao tách 3 features?

1. **Validate UX slider** với manual trước → bớt rủi ro cho F2
2. **AI Budget không cần onboarding** → có thể dùng local profile cho MVP F2
3. **Mỗi feature có thể hủy** nếu feedback xấu → không lãng phí effort
4. **F3 Onboarding** có thể dùng cho nhiều AI features sau, không chỉ budget

---

## F1 Status

✅ **F1 PercentAdjuster complete** (see `2026-06-05-f1-percent-adjuster-plan.md` for implementation plan).

**Components delivered:**
- `usePercentSum` hook (auto-balancing percent allocator) - 9 tests
- `PercentAdjuster` component (input + ±5% buttons + VND amount) - 10 tests
- `PercentAdjusterRow` wrapper (icon + name + adjuster + AI reasoning)

**Test coverage:** 19/19 tests passing
**Branch:** `code_ver2`
**Commits:** `1f016c4` (test infra), `1d5275a` (hook), `ff900ea` (component), `f079242` (wrapper)

Ready for F2 (AI Budget) integration.

---

## F2 Status

✅ **F2 AI Budget Generation — MVP complete** (see `2026-06-05-f2-ai-budget-plan.md` for full plan).

**Components delivered:**
- Backend: `BudgetSource` enum (MANUAL | AI_CONFIRMED) + nullable `walletId` + 3 AI metadata fields (`source`, `aiReasoning`, `draftId`)
- Backend: `BudgetDraftValidator` with full spec coverage (7 tests, TDD)
- Backend: `AiBudgetService` orchestrating Gemini + validator (inline prompt, 50/30/20 baseline)
- Backend: `AiBudgetController` (`POST /api/ai/budget/draft`)
- Backend: `BudgetService.createBatch()` + `POST /api/budgets/batch` endpoint
- Mobile: `aiBudgetApi.ts` (generateDraft + batchCreate)
- Mobile: `profileStorage.ts` (local-only SecureStore, no server sync)
- Mobile: `AiBudgetCreateScreen` (income + prompt + wallet scope)
- Mobile: `AiBudgetPreviewScreen` (reuses F1 `PercentAdjusterRow` + `usePercentSum`)
- Mobile: Routes `ai-create` + `ai-preview` registered, "Tạo bằng AI" button on BudgetToolScreen

**Test coverage:** 7 validator tests (TDD). Mobile: visual smoke test required.

**Branch:** `code_ver2`

**Scope decisions (vs original plan):**
- Dropped `HistoricalStatsRepository` → 50/30/20 baseline only (skip historical context for MVP)
- Dropped `draftStorage` → not needed, `profileStorage` is enough for resume
- Dropped `BudgetLocalDataSource` + sync update → rely on existing TanStack Query refetch + outbox pull
- Dropped 2 useEffect conflict in PreviewScreen → use `usePercentSum.amounts` as source of truth (no duplicate state)

**Known limitations (follow-ups):**
- PreviewScreen re-calls Gemini on mount (acceptable for MVP, could add ref guard)
- No rate limiting on `/api/ai/budget/draft`
- Period is read-only current month (date picker = follow-up)
- TypeScript may show "route not in type union" warning until expo-router regenerates (cache, not a real error)

## Quyết định thiết kế chính (áp dụng cho F1 + F2)

| Câu hỏi | Quyết định | Lý do |
|---------|-----------|-------|
| Wallet scope | Hybrid: nullable walletId, user chọn scope khi generate | Linh hoạt + không phức tạp edit |
| RAG strategy | Context Injection (không vector DB) | Data structured, không cần retrieval |
| LLM provider | Gemini (đã tích hợp) | Tận dụng AiProviderGateway hiện có |
| AI approach | Structured Output với Enum Constraint | Cân bằng đơn giản + robust |
| Số category | Tối đa 6 (khuyến nghị 4-5) | Tránh vặt vãnh |
| Base category | Luôn có "Tiết kiệm" trong output | Đảm bảo saving rate |
| Confirmation | Bắt buộc user confirm + slider | Không tự save, cho user kiểm soát |
| Draft state | Mobile local (AsyncStorage) | Không cần DB cho MVP |

---

## F1: Đơn giản hóa UX điều chỉnh Budget

### Mục tiêu
**BỎ slider bar**. Dùng **input số đơn giản + nút +5% / -5%** cho AI Budget. Manual giữ nguyên input VND như hiện tại.

### Lý do bỏ slider

- Mobile slider thường khó chỉnh chính xác
- User quen thuộc với input số + nút tăng/giảm hơn
- UX đơn giản, dễ implement, dễ test
- Không cần cài thêm dependency (`@react-native-community/slider`)

### Phân biệt Manual vs AI

| Use case | Điều chỉnh amount |
|----------|-------------------|
| **Manual budget** (hiện tại) | Input số VND trực tiếp + format VND (giữ nguyên) |
| **AI Budget** (F2) | Input % + nút +5% / -5%, hiển thị amount auto-calculated |

### UX điều chỉnh % (chỉ cho AI Budget)

```
┌─────────────────────────────────────┐
│ 🍜 Ăn uống                          │
│                                     │
│  [ -5% ]  [ 25  ] %  [ +5% ]        │
│                                     │
│  = 5,000,000 VND                    │
│                                     │
│  AI: "Ăn uống ~130k/ngày"           │
└─────────────────────────────────────┘
```

- **Input số %** (0-100): user gõ trực tiếp
- **Nút -5% / +5%**: bước nhảy nhanh, không cần kéo
- **Amount** = `income × % / 100` (auto-calculated, hiển thị readonly)
- **Category cuối (Tiết kiệm)**: input + nút bị **disable**, auto-fill = `100 - sum(khác)`

### Quy tắc

1. Input số % chấp nhận số nguyên 0-100
2. Nút -5% / +5%: bước nhảy cố định 5, round về 0 nếu âm
3. Khi user sửa 1 category → các category khác auto rebalance (trừ category cuối)
4. Category cuối (Tiết kiệm) luôn = 100 - sum(các category còn lại)
5. Nếu tổng sau khi sửa > 100: cảnh báo đỏ "Tổng vượt 100%"
6. Amount hiển thị format VND (1,000,000)
7. Nếu user sửa income: tất cả amount tự động recalc

### Components cần tạo

- `modules/budget/components/PercentAdjuster.tsx` - Input số + nút +/- 5%
- `modules/budget/components/PercentAdjusterRow.tsx` - Row đầy đủ (icon + name + adjuster + amount + AI reason)
- `modules/budget/hooks/usePercentSum.ts` - Hook tính tổng % + auto-adjust category cuối

### Files cần thay đổi (F1 - chỉ AI Budget)

**Không thay đổi** `BudgetEditScreen` (manual) - giữ nguyên input số VND.

**F1 chỉ cần**: tạo components mới, dùng cho F2 (`AiBudgetPreviewScreen`).

### Acceptance criteria

- [ ] Input số % chỉ chấp nhận số nguyên 0-100
- [ ] Nút -5% / +5% hoạt động đúng (giảm/tăng 5, round về 0)
- [ ] Amount auto-update khi đổi %
- [ ] Tổng % luôn = 100 sau khi user chỉnh (category cuối auto-fill)
- [ ] Format tiền VND đúng (1,000,000)
- [ ] Category cuối (Tiết kiệm) input + nút bị disable
- [ ] Không cần cài thêm dependency (dùng component có sẵn)

---

## F2: AI Budget Generation

### Mục tiêu
Cho phép user tạo budget bằng AI. Tận dụng slider **%** từ F1 cho UX chỉnh sửa.

### User Flow (F2 only, không cần F3)

1. User vào tab Budget → nhấn nút "Tạo bằng AI"
2. **Màn Create** (`AiBudgetCreateScreen`):
   - Nhập **income thực tế** (VD: 20,000,000)
   - Nhập **text mô tả** (VD: "Đám cưới 2tr, muốn mua iPhone")
   - Chọn **wallet scope**: Tất cả ví / 1 ví cụ thể
   - Chọn **thời gian** (default: tháng hiện tại, có thể sửa)
3. Bấm "Tạo" → loading → backend gọi Gemini
4. **Màn Preview** (`AiBudgetPreviewScreen`):
   - Hiển thị **time range** (editable)
   - Hiển thị **tổng income** (editable)
   - Hiển thị **danh sách categories** với slider % (từ F1) + AI reasoning
   - **Tiết kiệm** ở cuối, auto-fill = 100 - sum
   - **Toggle "Áp dụng cho ví"** (giống màn Create)
5. User chỉnh slider nếu muốn → bấm "Xác nhận" → batch save

### Layout chi tiết màn Preview

```
┌──────────────────────────────────────────────┐
│ ←  AI Budget Draft                          │
│                                              │
│ ╔══════════════════════════════════════════╗ │
│ ║ 📅 Thời gian budget                     ║ │  ← Editable
│ ║ 01/06/2026 → 30/06/2026  [Chỉnh] [▼]   ║ │
│ ╚══════════════════════════════════════════╝ │
│                                              │
│ ╔══════════════════════════════════════════╗ │
│ ║ 💰 Tổng thu nhập                        ║ │  ← Editable
│ ║ [   20,000,000 VND    ]                 ║ │
│ ╚══════════════════════════════════════════╝ │
│                                              │
│ ┌─ AI gợi ý ──────────────────────────────┐ │
│ │ 🍜 Ăn uống                              │ │
│ │   [-5%] [ 25 ] % [+5%]                   │ │
│ │   = 5,000,000 VND                       │ │
│ │   "Ăn uống ~130k/ngày"                  │ │
│ │                                          │ │
│ │ 🏠 Tiền nhà                              │ │
│ │   [-5%] [ 30 ] % [+5%]                   │ │
│ │   = 6,000,000 VND                       │ │
│ │   "Tiền nhà cố định"                    │ │
│ │                                          │ │
│ │ ⛽ Xăng xe                               │ │
│ │   [-5%] [ 15 ] % [+5%]                   │ │
│ │   = 3,000,000 VND                       │ │
│ │   "Xăng + Grab"                          │ │
│ │                                          │ │
│ │ 🎬 Giải trí                              │ │
│ │   [-5%] [ 10 ] % [+5%]                   │ │
│ │   = 2,000,000 VND                       │ │
│ │   "Cuối tuần"                            │ │
│ │                                          │ │
│ │ 💰 Tiết kiệm 🔒 (auto)                   │ │
│ │   [   ] [ 20 ] % [   ]                   │ │
│ │   = 4,000,000 VND                       │ │
│ │   "Dành mua iPhone"                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Tổng: 100% = 20,000,000 VND ✓              │
│                                              │
│ ╔══════════════════════════════════════════╗ │
│ ║ Áp dụng cho ví                           ║ │
│ ║ ● Tất cả ví                              ║ │
│ ║ ○ Chỉ ví: [Tiền mặt ▼]                  ║ │
│ ╚══════════════════════════════════════════╝ │
│                                              │
│ [    Xác nhận & Tạo budget    ]            │
└──────────────────────────────────────────────┘
```

### Database Schema (F2 only)

#### `budgets` (mở rộng - **không cần thay đổi `users` cho F2**)

```sql
ALTER TABLE budgets MODIFY:
  wallet_id DROP NOT NULL;  -- NULL = budget cho tất cả ví

ALTER TABLE budgets ADD COLUMN:
  source VARCHAR(20),        -- MANUAL | AI_CONFIRMED
  ai_reasoning TEXT,
  draft_id VARCHAR(36);      -- Nhóm budget cùng 1 lần tạo
```

**Quyết định:** F2 **không cần** mở rộng `users`. Profile data (income, goal) lưu local AsyncStorage trên mobile. Khi F3 (Onboarding) ship, sẽ sync lên server.

### API Endpoints (F2)

#### Generate AI Draft

```
POST /api/ai/budget/draft
Auth: Required
Body: {
  "income": 20000000,
  "userPrompt": "Đám cưới 2tr, muốn mua iPhone",
  "walletId": "uuid-or-null",     // null = tất cả ví
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-30"
}
Response: 200 OK {
  "draftId": "uuid",
  "items": [
    {
      "categoryId": "uuid",
      "categoryName": "Tiền nhà",
      "percent": 30,                    // % (0-100), thay vì amount
      "amount": 6000000,                // = income × percent / 100 (auto-calculated)
      "aiReasoning": "Tiền nhà cố định"
    }
  ],
  "summary": {
    "totalIncome": 20000000,
    "totalPercent": 100,
    "totalBudget": 20000000,
    "savingsPercent": 20,
    "savingsAmount": 4000000,
    "strategy": "Tăng tiết kiệm cho iPhone"
  }
}
Error: 400 nếu income <= 0, 503 nếu AI service down
```

#### Batch Save (User đã confirm)

```
POST /api/budgets/batch
Auth: Required
Body: {
  "draftId": "uuid",  // Reference từ draft, dùng làm idempotency key
  "walletId": "uuid-or-null",
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-30",
  "income": 20000000,                  // Có thể đã sửa từ draft
  "items": [
    { "categoryId": "uuid", "percent": 30, "amount": 6000000, "aiReasoning": "..." }
  ]
}
Response: 201 Created { budgets: [...BudgetResponse] }
```

### Context Injection (F2: 2 layers, không cần F3)

Vì F2 không cần onboarding, chỉ dùng 2 layers:

#### Layer 1: Prompt-time Context (luôn có)
- `income`: Thu nhập thực tế tháng này
- `userPrompt`: Text mô tả nhu cầu
- `walletScope`: Ví cụ thể hay tất cả ví

#### Layer 2: Historical Stats (chỉ khi có data)
Trigger khi user có ≥ 10 transactions (giảm từ 30 vì không có onboarding, user dùng manual trước).

Query SQL aggregate:
```sql
SELECT c.category_id, c.name, AVG(t.amount) as avg_amount, COUNT(*) as cnt
FROM transactions t
JOIN categories c ON t.category_id = c.category_id
WHERE t.user_id = ?
  AND t.type = 'EXPENSE'
  AND t.deleted_at IS NULL
  AND t.transaction_date >= ?  -- now - 6 months
GROUP BY c.category_id, c.name
HAVING cnt >= 3  -- Chỉ lấy category có đủ data
ORDER BY avg_amount DESC
LIMIT 15;
```

### System Prompt

```markdown
# ROLE
Bạn là trợ lý tài chính cá nhân. Phân bổ ngân sách tháng cho user dựa trên thu nhập và lịch sử chi tiêu.

# QUY TẮC BẮT BUỘC

1. CHỈ sử dụng categoryId từ AVAILABLE_CATEGORIES. Không tạo category mới.
2. Trả về **PERCENT** (số nguyên 0-100) cho mỗi category, KHÔNG trả về amount. Mobile sẽ tự tính amount = income × percent / 100.
3. Tổng tất cả percent PHẢI BẰNG CHÍNH XÁC 100.
4. LUÔN bao gồm category "Tiết kiệm" trong output.
5. Tối đa 6 categories (khuyến nghị 4-5).
6. Mỗi category có aiReasoning (1 câu, ≤ 100 ký tự, tiếng Việt).
7. Phân bổ theo nguyên tắc:
   - Thiếu data (user mới): dùng 50/30/20 baseline (50 needs, 30 wants, 20 savings)
   - Có historical: category hay chi nhiều → percent cao hơn để tránh vỡ
   - Có userPrompt đặc biệt (đám cưới, du lịch) → ưu tiên category phù hợp

# OUTPUT FORMAT
{
  "items": [
    { "categoryId": "uuid", "percent": 25, "aiReasoning": "Lý do" }
  ],
  "summary": {
    "strategy": "Mô tả chiến lược (1-2 câu)"
  }
}
```

### Validation Logic (Backend)

```java
// 1. Validate categoryId tồn tại (filter invalid)
// 2. Tính tổng percent
// 3. Ensure "Tiết kiệm" có mặt (nếu thiếu → thêm với diff percent)
// 4. Nếu sum(percent) != 100:
//    - Thiếu → cộng vào Tiết kiệm
//    - Thừa → scale down proportionally
// 5. Nếu > 6 categories: gộp category nhỏ nhất vào category linh hoạt
// 6. Mobile tự tính amount = income × percent / 100 sau khi nhận response
// 7. Round amount về 1000 VND ở mobile trước khi gửi batch save
```

### Sequence Diagram

```
Mobile → Backend: POST /ai/budget/draft { income, prompt, walletId, period }
Backend → Backend: Build context (categories + historical stats)
Backend → Gemini: HTTPS POST (system prompt + user context, JSON mode)
Gemini → Backend: Raw JSON response
Backend → Backend: Parse + validate + auto-adjust
Backend → Mobile: Return draft + summary

[User xem preview, chỉnh slider (F1)]

Mobile → Backend: POST /budgets/batch { draftId, items[] }
Backend → DB: Insert N Budget rows (source=AI_CONFIRMED, draftId, aiReasoning)
Backend → Mobile: 201 + budgets
```

### Edge Cases & Error Handling

| Case | Handling |
|------|----------|
| Gemini timeout/down | Return 503 với message "AI tạm thời không khả dụng" |
| User mới, chưa có transactions | Skip Layer 2, chỉ dùng Layer 1 + 50/30/20 baseline |
| User nhập income = 0 hoặc âm | Return 400 "Income phải > 0" |
| AI trả về category không tồn tại | Filter ra, log warning, tiếp tục validate |
| Sum(percent) != 100 | Auto-adjust (scale hoặc add to savings) |
| User spam /ai/budget/draft | Rate limit 10 lần/giờ/user |
| User confirm 2 lần (network retry) | Idempotency qua draftId |
| User sửa income trên Preview | Mobile recalc tất cả amount = income × percent / 100 |
| User sửa slider | Category cuối (Tiết kiệm) auto-fill = 100 - sum(khác) |
| User sửa % thành số lẻ (23.5) | Round về integer khi gửi API |

### Files cần thay đổi (F2)

**Backend:**
- `budget/model/Budget.java` - thêm source, aiReasoning, draftId; nullable walletId
- `budget/dto/BatchCreateBudgetRequest.java` - mới
- `budget/dto/BatchCreateBudgetResponse.java` - mới
- `budget/service/BudgetService.java` - thêm `createBatch()`
- `budget/controller/BudgetController.java` - endpoint POST /batch
- `ai/dto/AiBudgetDraftRequest.java` - mới
- `ai/dto/AiBudgetDraftResponse.java` - mới
- `ai/dto/BudgetItemDto.java` - mới
- `ai/service/AiBudgetService.java` - mới (orchestrate context + call Gemini + validate)
- `ai/controller/AiBudgetController.java` - mới
- `ai/prompt/BudgetPromptBuilder.java` - mới
- `ai/validation/BudgetDraftValidator.java` - mới
- `ai/repository/HistoricalStatsRepository.java` - mới (query aggregate)
- Migration Flyway: V14__add_ai_budgeting.sql

**Mobile:**
- `modules/budget/screens/AiBudgetCreateScreen.tsx` - mới (nhập income + prompt + wallet)
- `modules/budget/screens/AiBudgetPreviewScreen.tsx` - mới (xem draft + slider từ F1)
- `modules/budget/api/aiBudgetApi.ts` - mới
- `modules/budget/storage/draftStorage.ts` - mới (AsyncStorage)
- `modules/budget/storage/profileStorage.ts` - mới (lưu local profile tạm thời)

---

## F3: User Onboarding (3 câu hỏi)

### Mục tiêu
Thu thập thông tin tài chính cơ bản của user để cá nhân hóa AI features (không chỉ budget).

### 3 câu hỏi Onboarding

1. **Thu nhập dự kiến hàng tháng?** (nhập số)
2. **Tính chất thu nhập?** (Lương cố định / Biến động theo tháng / Freelance)
3. **Mục tiêu tài chính lớn nhất?** (Quỹ khẩn cấp / Mua nhà / Trả nợ / Du lịch / Nghỉ hưu / Khác)

### Database Schema (F3)

```sql
ALTER TABLE users ADD COLUMN:
  monthly_income_estimate DECIMAL(18,2),
  income_type VARCHAR(20),              -- STABLE | VARIABLE | FREELANCE
  financial_goal VARCHAR(50),           -- EMERGENCY_FUND | SAVE_HOUSE | DEBT_PAYOFF | TRAVEL | RETIREMENT | OTHER
  goal_target_amount DECIMAL(18,2),
  goal_target_date DATE,
  onboarding_completed_at TIMESTAMP;
```

### API Endpoints (F3)

```
POST /api/users/onboarding
Body: { monthlyIncomeEstimate, incomeType, financialGoal, goalTargetAmount, goalTargetDate }
→ 200 OK { UserResponse }
Side effect: Set onboardingCompletedAt = now()
```

### UX Flow (F3)

- App mở lần đầu → check `onboardingCompletedAt`
- Nếu NULL → show 3 màn onboarding tuần tự
- Có thể skip (lưu NULL) → dùng default values
- Sau khi complete → vào Home
- Có thể edit trong Profile settings

### Files cần thay đổi (F3)

**Backend:**
- `user/model/User.java` - thêm 6 fields onboarding
- `user/dto/OnboardingRequest.java` - mới
- `user/service/UserService.java` - thêm `completeOnboarding()`
- `user/controller/UserController.java` - endpoint POST /onboarding
- Migration Flyway: V15__add_user_onboarding.sql

**Mobile:**
- `app/(onboarding)/welcome.tsx` - mới
- `app/(onboarding)/income-step.tsx` - mới
- `app/(onboarding)/goal-step.tsx` - mới
- `app/(onboarding)/_layout.tsx` - mới (onboarding navigation)
- `core/storage/onboardingStorage.ts` - mới (track completed)
- Update `app/_layout.tsx` - route check onboarding

---

## Khuyến nghị triển khai

### Phase 1: F1 PercentAdjuster (~3-5 ngày)
- Tạo `PercentAdjuster` component (input số + nút +/-5%)
- Tạo `usePercentSum` hook
- **Không cần** refactor `BudgetEditScreen` (manual giữ nguyên)
- F1 chỉ dùng cho F2 AI Budget sau này
- Test component độc lập
- **Validate UX** với user thật trước khi sang F2

### Phase 2: F2 AI Budget (~2-3 tuần, sau F1)
- DB migration cho `budgets`
- Backend: 2 endpoints + Gemini integration
- Mobile: 2 màn mới (Create + Preview) + dùng slider từ F1
- Test với nhiều user personas (user mới, user có data)
- **Validate AI chất lượng draft** với user thật

### Phase 3: F3 Onboarding (~1-2 tuần, có thể song song)
- DB migration cho `users`
- Backend: endpoint onboarding
- Mobile: 3 màn onboarding + routing logic
- **Khi F3 ship**: F2 sẽ dùng onboarding profile thay vì local storage

### Phase 4: Polish
- Rate limiting
- Caching draft ở Redis
- Analytics tracking
- "Regenerate" button (nếu user không thích draft)
- A/B test nhiều prompt variants

### Phase 5: Advanced
- AI đề xuất điều chỉnh giữa tháng khi vượt budget
- So sánh budget qua các tháng
- Gợi ý "category nào nên thêm/bớt" dựa trên pattern

---

## Open Questions (cần verify khi implement)

| # | Câu hỏi | Kết quả verify | Status |
|---|---------|----------------|--------|
| 1 | App hiện tại đã có onboarding chưa? | **KHÔNG có**. `app/index.tsx` redirect thẳng về `/login`. `RegisterScreen` chỉ có form cơ bản. F3 sẽ tạo mới hoàn toàn. | ✅ Resolved |
| 2 | ~~Slider library nào dùng?~~ | ~~`@react-native-community/slider` hoặc custom~~ | ✅ Resolved: Bỏ slider bar, dùng input số + nút +/-5% |
| 3 | Sync logic cho budget mới từ AI? | **SyncService đã có sẵn infrastructure** (outbox pattern, push/pull, handle conflict). Cần thêm `budgetLocalDataSource` + update `applyChanges`/`applyDeletes` thêm `budgets`. F2 mobile +1-2 ngày cho sync. | ✅ Resolved |
| 4 | Tần suất user nhập transaction thực tế? | Không verify được (cần data thật). Estimate: 3-10 tx/tuần → 1 tháng = 12-40 tx. Trigger `≥ 10 transactions` hợp lý. | ✅ Resolved (giữ trigger 10, điều chỉnh sau) |
| 5 | Cost estimate Gemini API? | Không verify được. Estimate: Gemini 1.5 Flash ~$0.0002/lần generate. Rate limit 10/giờ/user → max $0.05/ngày/user. 1000 user = $50/ngày. **Không concern cho MVP.** | ✅ Resolved (cost thấp) |
| 6 | Có cần auth/permission riêng cho AI? | Chưa verify. Có thể bỏ qua MVP, dùng JWT hiện có + rate limit theo userId. Tier-based limit để phase sau. | ⚠️ Partial: dùng JWT + simple rate limit |
| 7 | Manual budget hiện support N categories/budget, AI sẽ 1 category/budget. Có conflict không? | Check `BudgetEditScreen` (đã thấy) | ✅ Resolved: Giữ manual như cũ, AI dùng model mới |

---

## Tài liệu tham khảo

- [Gemini JSON Mode](https://ai.google.dev/docs/json_mode)
- [Codebase: AiProviderGateway](../be_money_tracker/src/main/java/com/examples/moneytracker/ai/provider/AiProviderGateway.java)
- [Codebase: Budget entity](../be_money_tracker/src/main/java/com/examples/moneytracker/budget/model/Budget.java)
- [Codebase: Category icons spec](./2026-06-03-category-icons-design.md)

---

## Ghi chú quan trọng

**Status: Reference/Brainstorm only.** Document này tổng hợp ý tưởng + review từ user. Chưa có commitment để implement. Nếu user quyết định làm, cần:

1. Verify các Open Questions ở trên
2. Estimate effort thực tế với codebase hiện tại
3. Có thể dùng lại approach này cho feature khác (AI phân tích chi tiêu, AI gợi ý tiết kiệm)
4. Bắt đầu từ F1 (Slider) → validate UX trước khi invest vào F2 (AI)
