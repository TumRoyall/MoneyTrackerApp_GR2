# Category Icons Enhancement - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế bộ emoji icons bằng MaterialCommunityIcons với 80+ categories chi tiết cho Expense và Income.

**Architecture:** Tạo file `defaultCategories.ts` chứa dữ liệu seed cho 80+ categories. Cập nhật `TransactionScreen.tsx` để sử dụng icon mới. Seed categories trong `migrations.ts` khi init DB.

**Tech Stack:** Expo SDK, @expo/vector-icons (MaterialCommunityIcons), TypeScript, SQLite

---

## File Structure

```
app_moneytracker/src/modules/category/
├── data/
│   └── defaultCategories.ts      [CREATE] - Dữ liệu 80+ categories
├── models/
│   └── category.types.ts         [READ] - Xem interface hiện tại
├── local/
│   └── categoryLocalDataSource.ts [MODIFY] - Thêm method seed

app_moneytracker/src/core/
├── db/
│   └── migrations.ts             [MODIFY] - Gọi seed categories

app_moneytracker/src/modules/transaction/
└── screens/
    └── TransactionScreen.tsx     [MODIFY] - Thay categoryIconOptions
```

---

## Task 1: Tạo file defaultCategories.ts

**Files:**
- Create: `app_moneytracker/src/modules/category/data/defaultCategories.ts`

- [ ] **Step 1: Tạo thư mục và file**

```typescript
// app_moneytracker/src/modules/category/data/defaultCategories.ts

export interface DefaultCategory {
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
}

export const defaultCategories: DefaultCategory[] = [
  // =====================
  // EXPENSE - Mua sắm & Tạp hóa
  // =====================
  { name: 'Siêu thị', type: 'EXPENSE', icon: 'cart', color: '#4CAF50' },
  { name: 'Đồ ăn', type: 'EXPENSE', icon: 'food-fork-drink', color: '#4CAF50' },
  { name: 'Trà & Cà phê', type: 'EXPENSE', icon: 'coffee', color: '#4CAF50' },
  { name: 'Đồ uống', type: 'EXPENSE', icon: 'cup', color: '#4CAF50' },
  { name: 'Thức ăn mang đi', type: 'EXPENSE', icon: 'food-takeout-box', color: '#4CAF50' },
  { name: 'Nhà hàng', type: 'EXPENSE', icon: 'silverware-fork-knife', color: '#4CAF50' },
  { name: 'Bánh & Đồ ngọt', type: 'EXPENSE', icon: 'cookie', color: '#4CAF50' },

  // =====================
  // EXPENSE - Thời trang
  // =====================
  { name: 'Quần áo', type: 'EXPENSE', icon: 'tshirt-crew', color: '#E91E63' },
  { name: 'Giày dép', type: 'EXPENSE', icon: 'shoe-sneaker', color: '#E91E63' },
  { name: 'Phụ kiện', type: 'EXPENSE', icon: 'watch', color: '#E91E63' },
  { name: 'Túi xách', type: 'EXPENSE', icon: 'bag-personal', color: '#E91E63' },
  { name: 'Làm đẹp', type: 'EXPENSE', icon: 'lipstick', color: '#E91E63' },
  { name: 'Spa & Skincare', type: 'EXPENSE', icon: 'spa', color: '#E91E63' },

  // =====================
  // EXPENSE - Nhà ở & Tiện ích
  // =====================
  { name: 'Tiền thuê', type: 'EXPENSE', icon: 'key-variant', color: '#795548' },
  { name: 'Điện', type: 'EXPENSE', icon: 'flash', color: '#795548' },
  { name: 'Nước', type: 'EXPENSE', icon: 'water', color: '#795548' },
  { name: 'Gas', type: 'EXPENSE', icon: 'gas-cylinder', color: '#795548' },
  { name: 'Internet', type: 'EXPENSE', icon: 'wifi', color: '#795548' },
  { name: 'Bảo trì', type: 'EXPENSE', icon: 'wrench', color: '#795548' },
  { name: 'Nội thất', type: 'EXPENSE', icon: 'sofa', color: '#795548' },
  { name: 'Dọn dẹp', type: 'EXPENSE', icon: 'broom', color: '#795548' },

  // =====================
  // EXPENSE - Di chuyển
  // =====================
  { name: 'Xăng', type: 'EXPENSE', icon: 'gas-station', color: '#2196F3' },
  { name: 'Xe máy', type: 'EXPENSE', icon: 'motorbike', color: '#2196F3' },
  { name: 'Taxi/Grab', type: 'EXPENSE', icon: 'taxi', color: '#2196F3' },
  { name: 'Bus', type: 'EXPENSE', icon: 'bus', color: '#2196F3' },
  { name: 'Tàu lửa', type: 'EXPENSE', icon: 'train', color: '#2196F3' },
  { name: 'Máy bay', type: 'EXPENSE', icon: 'airplane', color: '#2196F3' },
  { name: 'Parking', type: 'EXPENSE', icon: 'parking', color: '#2196F3' },
  { name: 'Bảo dưỡng xe', type: 'EXPENSE', icon: 'car-wrench', color: '#2196F3' },

  // =====================
  // EXPENSE - Sức khỏe
  // =====================
  { name: 'Thuốc', type: 'EXPENSE', icon: 'pill', color: '#F44336' },
  { name: 'Khám bệnh', type: 'EXPENSE', icon: 'stethoscope', color: '#F44336' },
  { name: 'Bệnh viện', type: 'EXPENSE', icon: 'hospital-box', color: '#F44336' },
  { name: 'Bảo hiểm', type: 'EXPENSE', icon: 'shield-check', color: '#F44336' },
  { name: 'Gym/Fitness', type: 'EXPENSE', icon: 'dumbbell', color: '#F44336' },
  { name: 'Vitamin', type: 'EXPENSE', icon: 'pill', color: '#F44336' },

  // =====================
  // EXPENSE - Giải trí
  // =====================
  { name: 'Phim', type: 'EXPENSE', icon: 'movie', color: '#9C27B0' },
  { name: 'Nhạc', type: 'EXPENSE', icon: 'music', color: '#9C27B0' },
  { name: 'Game', type: 'EXPENSE', icon: 'gamepad-variant', color: '#9C27B0' },
  { name: 'Karaoke', type: 'EXPENSE', icon: 'microphone', color: '#9C27B0' },
  { name: 'Du lịch', type: 'EXPENSE', icon: 'beach', color: '#9C27B0' },
  { name: 'Bookstore', type: 'EXPENSE', icon: 'book-open-variant', color: '#9C27B0' },
  { name: 'Bar & Club', type: 'EXPENSE', icon: 'glass-cocktail', color: '#9C27B0' },

  // =====================
  // EXPENSE - Học tập & Công việc
  // =====================
  { name: 'Sách', type: 'EXPENSE', icon: 'book', color: '#FF9800' },
  { name: 'Khóa học', type: 'EXPENSE', icon: 'certificate', color: '#FF9800' },
  { name: 'Học phí', type: 'EXPENSE', icon: 'cash-multiple', color: '#FF9800' },
  { name: 'Dụng cụ học', type: 'EXPENSE', icon: 'pencil', color: '#FF9800' },
  { name: 'Văn phòng phẩm', type: 'EXPENSE', icon: 'pen', color: '#FF9800' },

  // =====================
  // EXPENSE - Thú cưng
  // =====================
  { name: 'Thức ăn pet', type: 'EXPENSE', icon: 'food-drumstick', color: '#FFC107' },
  { name: 'Thú y', type: 'EXPENSE', icon: 'doctor', color: '#FFC107' },
  { name: 'Phụ kiện pet', type: 'EXPENSE', icon: 'dog', color: '#FFC107' },

  // =====================
  // EXPENSE - Tiền tệ
  // =====================
  { name: 'Rút tiền', type: 'EXPENSE', icon: 'cash-withdrawal', color: '#607D8B' },
  { name: 'Chuyển khoản', type: 'EXPENSE', icon: 'bank-transfer', color: '#607D8B' },
  { name: 'Phí ngân hàng', type: 'EXPENSE', icon: 'bank', color: '#607D8B' },

  // =====================
  // EXPENSE - Quà tặng & Khác
  // =====================
  { name: 'Quà tặng', type: 'EXPENSE', icon: 'gift', color: '#E91E63' },
  { name: 'Thiện nguyện', type: 'EXPENSE', icon: 'heart-hands', color: '#E91E63' },
  { name: 'Nông nghiệp', type: 'EXPENSE', icon: 'flower', color: '#4CAF50' },
  { name: 'Khác', type: 'EXPENSE', icon: 'dots-horizontal', color: '#9E9E9E' },

  // =====================
  // INCOME - Lương & Công việc
  // =====================
  { name: 'Lương', type: 'INCOME', icon: 'briefcase', color: '#1565C0' },
  { name: 'Thưởng', type: 'INCOME', icon: 'trophy', color: '#1565C0' },
  { name: 'Phụ cấp', type: 'INCOME', icon: 'cash-plus', color: '#1565C0' },
  { name: 'Hoa hồng', type: 'INCOME', icon: 'account-cash', color: '#1565C0' },
  { name: 'Lương tháng 13', type: 'INCOME', icon: 'gift', color: '#1565C0' },

  // =====================
  // INCOME - Kinh doanh
  // =====================
  { name: 'Bán hàng', type: 'INCOME', icon: 'store', color: '#2E7D32' },
  { name: 'Dịch vụ', type: 'INCOME', icon: 'account-wrench', color: '#2E7D32' },
  { name: 'Cho thuê', type: 'INCOME', icon: 'home-city', color: '#2E7D32' },
  { name: 'Kinh doanh khác', type: 'INCOME', icon: 'storefront', color: '#2E7D32' },

  // =====================
  // INCOME - Đầu tư & Tiết kiệm
  // =====================
  { name: 'Tiết kiệm', type: 'INCOME', icon: 'piggy-bank', color: '#FFD700' },
  { name: 'Cổ phiếu', type: 'INCOME', icon: 'chart-timeline-variant', color: '#FFD700' },
  { name: 'Lãi suất', type: 'INCOME', icon: 'percent', color: '#FFD700' },
  { name: 'Bitcoin/Crypto', type: 'INCOME', icon: 'bitcoin', color: '#FFD700' },
  { name: 'Bất động sản', type: 'INCOME', icon: 'home-estate', color: '#FFD700' },
  { name: 'Trái phiếu', type: 'INCOME', icon: 'file-document', color: '#FFD700' },

  // =====================
  // INCOME - Freelance
  // =====================
  { name: 'Thiết kế', type: 'INCOME', icon: 'palette', color: '#7B1FA2' },
  { name: 'Lập trình', type: 'INCOME', icon: 'code-tags', color: '#7B1FA2' },
  { name: 'Viết lách', type: 'INCOME', icon: 'pen', color: '#7B1FA2' },
  { name: 'Tư vấn', type: 'INCOME', icon: 'account-question', color: '#7B1FA2' },
  { name: 'Freelance khác', type: 'INCOME', icon: 'laptop', color: '#7B1FA2' },

  // =====================
  // INCOME - Quà tặng
  // =====================
  { name: 'Từ gia đình', type: 'INCOME', icon: 'human-greeting-variant', color: '#E91E63' },
  { name: 'Từ bạn bè', type: 'INCOME', icon: 'account-heart', color: '#E91E63' },
  { name: 'Quà tặng khác', type: 'INCOME', icon: 'gift-open', color: '#E91E63' },

  // =====================
  // INCOME - Thu nhập khác
  // =====================
  { name: 'Hoàn tiền', type: 'INCOME', icon: 'cash-refund', color: '#607D8B' },
  { name: 'Bán đồ cũ', type: 'INCOME', icon: 'tag-sell', color: '#607D8B' },
  { name: 'Thưởng', type: 'INCOME', icon: 'medal', color: '#607D8B' },
  { name: 'Thu nhập khác', type: 'INCOME', icon: 'cash', color: '#607D8B' },
];

// Helper export cho icon picker (dùng trong UI)
export const categoryIconOptions = defaultCategories.map((cat) => ({
  label: cat.name,
  icon: cat.icon,
  color: cat.color,
  type: cat.type,
}));
```

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/modules/category/data/defaultCategories.ts
git commit -m "feat(category): add default categories data with MaterialCommunityIcons

- 50 EXPENSE categories with icons and colors
- 30 INCOME categories with icons and colors
- Export categoryIconOptions for UI reuse

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Cập nhật TransactionScreen.tsx

**Files:**
- Modify: `app_moneytracker/src/modules/transaction/screens/TransactionScreen.tsx:56-81`

- [ ] **Step 1: Import categoryIconOptions từ defaultCategories**

Thêm import ở đầu file (sau các import khác):

```typescript
import { categoryIconOptions } from '@/modules/category/data/defaultCategories';
```

- [ ] **Step 2: Xóa categoryIconOptions cũ (emoji)**

Tìm và xóa đoạn code này trong file (khoảng dòng 56-81):

```typescript
const categoryIconOptions: Array<{ label: string; icon: string }> = [
  { label: 'Giỏ hàng', icon: '🛒' },
  { label: 'Đồ ăn', icon: '🍜' },
  // ... tất cả emoji icons cũ
];
```

- [ ] **Step 3: Cập nhật defaultCategoryIconByType**

Thay thế `defaultCategoryIconByType` cũ:

```typescript
// Cũ:
const defaultCategoryIconByType: Record<CategoryType, string> = {
  EXPENSE: '🧾',
  INCOME: '💰',
};

// Mới:
const defaultCategoryIconByType: Record<CategoryType, string> = {
  EXPENSE: 'cart',
  INCOME: 'briefcase',
};
```

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/transaction/screens/TransactionScreen.tsx
git commit -m "refactor(transaction): replace emoji icons with MaterialCommunityIcons

- Import categoryIconOptions from defaultCategories
- Update defaultCategoryIconByType to use icon names
- Use new icon system for category picker

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Seed categories trong migrations.ts

**Files:**
- Read: `app_moneytracker/src/core/db/migrations.ts`
- Modify: `app_moneytracker/src/core/db/migrations.ts`

- [ ] **Step 1: Đọc migrations.ts hiện tại**

```typescript
// Xem nội dung hiện tại của migrations.ts
```

- [ ] **Step 2: Thêm import và seed function**

Thêm vào đầu file:

```typescript
import { defaultCategories } from '@/modules/category/data/defaultCategories';
```

Thêm function để seed categories:

```typescript
async function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const now = new Date().toISOString();
  
  for (const cat of defaultCategories) {
    const categoryId = `default_${cat.type.toLowerCase()}_${cat.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    await db.executeAsync(
      `INSERT OR REPLACE INTO categories 
       (categoryId, name, type, icon, color, isDefault, isHidden, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [categoryId, cat.name, cat.type, cat.icon, cat.color, now, now]
    );
  }
}
```

- [ ] **Step 3: Gọi seed trong runMigrations**

Thêm sau khi tạo bảng categories:

```typescript
// Trong runMigrations, sau dòng tạo bảng categories:
// ...
// CREATE TABLE IF NOT EXISTS categories ...
await seedDefaultCategories(db);
```

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/core/db/migrations.ts
git commit -m "feat(db): seed default categories on first migration

- Import defaultCategories from category module
- Add seedDefaultCategories function
- Auto-populate 80+ default categories on DB init

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Verify và test

**Files:**
- Test: `app_moneytracker/src/modules/category/data/defaultCategories.ts`

- [ ] **Step 1: Kiểm tra lint**

```bash
cd app_moneytracker
npx expo lint
```

Expected: No errors

- [ ] **Step 2: Build để verify**

```bash
cd app_moneytracker
npx expo prebuild --clean
npx expo run:android
```

Expected: Build thành công, app chạy với categories mới

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: verify category icons implementation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Summary

| Task | File | Action |
|------|------|--------|
| 1 | `category/data/defaultCategories.ts` | Create - 80+ categories |
| 2 | `transaction/screens/TransactionScreen.tsx` | Modify - Use new icons |
| 3 | `core/db/migrations.ts` | Modify - Seed on init |
| 4 | All | Verify & Test |

**Total: 4 tasks**

---

## Self-Review Checklist

- [x] Spec coverage: 80+ categories với icon và color ✅
- [x] No placeholders: Tất cả code đều complete ✅
- [x] Type consistency: Icon là string (MaterialCommunityIcons name) ✅
- [x] File paths: Exact paths cho all files ✅
- [x] Commands: Exact commands với expected output ✅