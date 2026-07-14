# Onboarding Feature Design

**Date:** 2026-07-14
**Status:** Approved

## Overview

Triển khai tính năng **Onboarding** dành cho người dùng sử dụng ứng dụng lần đầu. Onboarding thu thập thông tin cơ bản để phục vụ cho tính năng Smart Budget. Chỉ hiển thị một lần.

## Approach

**Selected Approach: Onboarding Screen riêng biệt với Local Storage**

- Tạo `app/onboarding.tsx` như một Stack screen riêng
- Lưu trạng thái hoàn thành và dữ liệu vào `expo-secure-store`
- Kiểm tra trạng thái trong LoginScreen sau khi login thành công
- Không cần thay đổi backend

## File Structure

```
app_moneytracker/
├── app/
│   └── onboarding.tsx              # Onboarding screen chính (stepper)
├── src/
│   └── modules/
│       └── onboarding/
│           ├── components/          # UI components
│           │   ├── StepIndicator.tsx
│           │   ├── WelcomeStep.tsx
│           │   ├── UserTypeStep.tsx
│           │   ├── IncomeStep.tsx
│           │   ├── ExpensesStep.tsx
│           │   ├── SavingsStep.tsx
│           │   └── CompletionStep.tsx
│           ├── hooks/               # Business logic
│           │   └── useOnboarding.ts
│           ├── storage/              # Local persistence
│           │   └── onboardingStorage.ts
│           └── models/               # Types
│               └── onboarding.types.ts
```

## Data Model

```typescript
export interface OnboardingData {
  userType: 'STUDENT' | 'OFFICE_WORKER' | 'FREELANCER' | 'BUSINESS' | 'FAMILY' | null;
  incomeRange: 'UNDER_5M' | '5M_10M' | '10M_20M' | 'OVER_20M' | null;
  selectedExpenseCategories: string[]; // categoryIds
  savingTargetPercent: number; // 10, 20, 30, 40
  isCompleted: boolean;
  completedAt: string | null;
}
```

**Default values:**
- `userType`: null
- `incomeRange`: null
- `selectedExpenseCategories`: []
- `savingTargetPercent`: 20
- `isCompleted`: false
- `completedAt`: null

## Onboarding Steps

### Step 1: Welcome (WelcomeStep)
**Title:** 👋 Chào mừng bạn đến với Money Tracker!

**Description:** Chỉ mất khoảng 30 giây để thiết lập hồ sơ ban đầu. Dựa trên những thông tin bạn cung cấp, ứng dụng sẽ tự động tạo kế hoạch ngân sách phù hợp với bạn.

**Button:** Bắt đầu

---

### Step 2: User Type (UserTypeStep)
**Title:** Bạn đang ở giai đoạn nào?

**Options (Single choice):**
| Emoji | Label | Value |
|-------|-------|-------|
| 🎓 | Sinh viên | STUDENT |
| 💼 | Nhân viên văn phòng | OFFICE_WORKER |
| 💻 | Freelancer | FREELANCER |
| 🏪 | Kinh doanh | BUSINESS |
| 👨‍👩‍👧 | Đã có gia đình | FAMILY |

---

### Step 3: Income Range (IncomeStep)
**Title:** Thu nhập hàng tháng của bạn khoảng bao nhiêu?

**Options (Single choice):**
| Label | Value |
|-------|-------|
| Dưới 5 triệu | UNDER_5M |
| 5 - 10 triệu | 5M_10M |
| 10 - 20 triệu | 10M_20M |
| Trên 20 triệu | OVER_20M |

---

### Step 4: Expense Categories (ExpensesStep)
**Title:** Các khoản thường xuyên bạn phải chi tiêu trong tháng là?

**Behavior:**
- Query categories từ local SQLite (type = 'EXPENSE', isDefault = true)
- Multi-select với checkbox
- User có thể bỏ trống (skip by default)

---

### Step 5: Savings Target (SavingsStep)
**Title:** Bạn muốn tiết kiệm bao nhiêu tài sản?

**Slider Options:** 10%, 20%, 30%, 40%

**Special Option:**
> ⭐ **Khuyên dùng**
> Áp dụng quy tắc 50/30/20

**Behavior:**
- Default: 20%
- Quy tắc 50/30/20 → auto set savingTargetPercent = 20

---

### Step 6: Completion (CompletionStep)
**Title:** 🎉 Mọi thứ đã sẵn sàng!

**Description:** Chúng tôi sẽ sử dụng thông tin bạn vừa cung cấp để tạo ngân sách thông minh dựa trên tổng tài sản của bạn khi bạn sử dụng tính năng Smart Budget.

**Button:** Hoàn tất

---

## Navigation Flow

```
LoginScreen (sau khi login thành công)
    ↓
kiểm tra onboardingStorage.isCompleted
    ↓
├── true → router.replace('/(tabs)/wallets')
└── false → router.replace('/onboarding')

OnboardingScreen (sau khi hoàn thành)
    ↓
router.replace('/(tabs)/wallets')
```

## Settings Integration

Trong `settings.tsx`, thêm option:
- **Title:** Thiết lập lại thông tin cá nhân
- **Action:** Reset `isCompleted = false` → router.replace('/onboarding')
- **Confirmation:** Alert xác nhận trước khi reset

## UI Style

Follow existing app patterns:
- Primary color: `#29bcc5` (cyan)
- Background: `#f1fbfd`
- Card background: `#ffffff`
- Border radius: 16-24
- Font: System default
- Step indicator: Progress bar với dots

## Storage

**Storage:** `expo-secure-store`
- Key: `onboarding_data`
- Value: JSON.stringify of OnboardingData

## Notes

- Onboarding **KHÔNG tạo Budget**
- Onboarding chỉ thu thập dữ liệu
- Việc tạo Budget sẽ thực hiện ở tính năng Smart Budget
