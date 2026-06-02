# Design: Bộ Category Icons Mới cho MoneyTracker

**Date:** 2026-06-03  
**Status:** Approved  
**Type:** Feature Enhancement

## Overview

Thay thế bộ emoji icons hiện tại bằng MaterialCommunityIcons (có sẵn trong Expo, không cần cài thêm thư viện) để có bộ icon chi tiết và chuyên nghiệp hơn.

## Icon Set

**Source:** `@expo/vector-icons` → `MaterialCommunityIcons`

**Lợi ích:**
- ✅ Có sẵn trong Expo (không cần cài thêm)
- ✅ 7000+ icons, đa dạng cho tài chính & lifestyle
- ✅ Nhiều variants để customize

## Bộ Category Mặc định

### EXPENSE (50 categories)

#### 🛒 Mua sắm & Tạp hóa
| Tên | Icon | Color |
|-----|------|-------|
| Siêu thị | `cart` | #4CAF50 |
| Đồ ăn | `food-fork-drink` | #4CAF50 |
| Trà & Cà phê | `coffee` | #4CAF50 |
| Đồ uống | `cup` | #4CAF50 |
| Thức ăn mang đi | `food-takeout-box` | #4CAF50 |
| Nhà hàng | `silverware-fork-knife` | #4CAF50 |
| Bánh & Đồ ngọt | `cookie` | #4CAF50 |

#### 👔 Thời trang
| Tên | Icon | Color |
|-----|------|-------|
| Quần áo | `tshirt-crew` | #E91E63 |
| Giày dép | `shoe-sneaker` | #E91E63 |
| Phụ kiện | `watch` | #E91E63 |
| Túi xách | `bag-personal` | #E91E63 |
| Làm đẹp | `lipstick` | #E91E63 |
| Spa & Skincare | `spa` | #E91E63 |

#### 🏠 Nhà ở & Tiện ích
| Tên | Icon | Color |
|-----|------|-------|
| Tiền thuê | `key-variant` | #795548 |
| Điện | `flash` | #795548 |
| Nước | `water` | #795548 |
| Gas | `gas-cylinder` | #795548 |
| Internet | `wifi` | #795548 |
| Bảo trì | `wrench` | #795548 |
| Nội thất | `sofa` | #795548 |
| Dọn dẹp | `broom` | #795548 |

#### 🚗 Di chuyển
| Tên | Icon | Color |
|-----|------|-------|
| Xăng | `gas-station` | #2196F3 |
| Xe máy | `motorbike` | #2196F3 |
| Taxi/Grab | `taxi` | #2196F3 |
| Bus | `bus` | #2196F3 |
| Tàu lửa | `train` | #2196F3 |
| Máy bay | `airplane` | #2196F3 |
| Parking | `parking` | #2196F3 |
| Bảo dưỡng xe | `car-wrench` | #2196F3 |

#### 💊 Sức khỏe
| Tên | Icon | Color |
|-----|------|-------|
| Thuốc | `pill` | #F44336 |
| Khám bệnh | `stethoscope` | #F44336 |
| Bệnh viện | `hospital-box` | #F44336 |
| Bảo hiểm | `shield-check` | #F44336 |
| Gym/Fitness | `dumbbell` | #F44336 |
| Vitamin | `pill` | #F44336 |

#### 🎮 Giải trí
| Tên | Icon | Color |
|-----|------|-------|
| Phim | `movie` | #9C27B0 |
| Nhạc | `music` | #9C27B0 |
| Game | `gamepad-variant` | #9C27B0 |
| Karaoke | `microphone` | #9C27B0 |
| Du lịch | `beach` | #9C27B0 |
| Bookstore | `book-open-variant` | #9C27B0 |
| Bar & Club | `glass-cocktail` | #9C27B0 |

#### 📚 Học tập & Công việc
| Tên | Icon | Color |
|-----|------|-------|
| Sách | `book` | #FF9800 |
| Khóa học | `certificate` | #FF9800 |
| Học phí | `cash-multiple` | #FF9800 |
| Dụng cụ học | `pencil` | #FF9800 |
| Văn phòng phẩm | `pen` | #FF9800 |

#### 🐾 Thú cưng
| Tên | Icon | Color |
|-----|------|-------|
| Thức ăn pet | `food-drumstick` | #FFC107 |
| Thú y | `doctor` | #FFC107 |
| Phụ kiện pet | `dog` | #FFC107 |

#### 💵 Tiền tệ
| Tên | Icon | Color |
|-----|------|-------|
| Rút tiền | `cash-withdrawal` | #607D8B |
| Chuyển khoản | `bank-transfer` | #607D8B |
| Phí ngân hàng | `bank` | #607D8B |

#### 🎁 Quà tặng & Khác
| Tên | Icon | Color |
|-----|------|-------|
| Quà tặng | `gift` | #E91E63 |
| Thiện nguyện | `heart-hands` | #E91E63 |
| Nông nghiệp | `flower` | #4CAF50 |
| Khác | `dots-horizontal` | #9E9E9E |

---

### INCOME (30 categories)

#### 💼 Lương & Công việc
| Tên | Icon | Color |
|-----|------|-------|
| Lương | `briefcase` | #1565C0 |
| Thưởng | `trophy` | #1565C0 |
| Phụ cấp | `cash-plus` | #1565C0 |
| Hoa hồng | `account-cash` | #1565C0 |
| 13th month salary | `gift` | #1565C0 |

#### 🏪 Kinh doanh
| Tên | Icon | Color |
|-----|------|-------|
| Bán hàng | `store` | #2E7D32 |
| Dịch vụ | `account-wrench` | #2E7D32 |
| Cho thuê | `home-city` | #2E7D32 |
| Kinh doanh khác | `storefront` | #2E7D32 |

#### 📈 Đầu tư & Tiết kiệm
| Tên | Icon | Color |
|-----|------|-------|
| Tiết kiệm | `piggy-bank` | #FFD700 |
| Cổ phiếu | `chart-timeline-variant` | #FFD700 |
| Lãi suất | `percent` | #FFD700 |
| Bitcoin/Crypto | `bitcoin` | #FFD700 |
| Bất động sản | `home-estate` | #FFD700 |
| Trái phiếu | `file-document` | #FFD700 |

#### 💻 Freelance
| Tên | Icon | Color |
|-----|------|-------|
| Thiết kế | `palette` | #7B1FA2 |
| Lập trình | `code-tags` | #7B1FA2 |
| Viết lách | `pen` | #7B1FA2 |
| Tư vấn | `account-question` | #7B1FA2 |
| Freelance khác | `laptop` | #7B1FA2 |

#### 🎁 Quà tặng
| Tên | Icon | Color |
|-----|------|-------|
| Từ gia đình | `human-greeting-variant` | #E91E63 |
| Từ bạn bè | `account-heart` | #E91E63 |
| Quà tặng khác | `gift-open` | #E91E63 |

#### 🔄 Thu nhập khác
| Tên | Icon | Color |
|-----|------|-------|
| Hoàn tiền | `cash-refund` | #607D8B |
| Bán đồ cũ | `tag-sell` | #607D8B |
| Thưởng | `medal` | #607D8B |
| Khác | `cash` | #607D8B |

---

## Màu sắc theo nhóm

```typescript
const EXPENSE_COLORS = {
  food: '#4CAF50',      // Xanh lá - Thực phẩm
  fashion: '#E91E63',   // Hồng - Thời trang
  housing: '#795548',   // Nâu - Nhà ở
  transport: '#2196F3', // Xanh dương - Di chuyển
  health: '#F44336',    // Đỏ - Sức khỏe
  entertainment: '#9C27B0', // Tím - Giải trí
  education: '#FF9800', // Cam - Học tập
  pets: '#FFC107',      // Vàng - Thú cưng
  money: '#607D8B',     // Xám - Tiền tệ
  gifts: '#E91E63',     // Hồng - Quà tặng
};

const INCOME_COLORS = {
  salary: '#1565C0',    // Xanh dương đậm - Lương
  business: '#2E7D32',   // Xanh lá đậm - Kinh doanh
  investment: '#FFD700', // Vàng gold - Đầu tư
  freelance: '#7B1FA2', // Tím đậm - Freelance
  gifts: '#E91E63',     // Hồng - Quà tặng
  other: '#607D8B',     // Xám - Khác
};
```

---

## Files cần thay đổi

1. **Tạo `app_moneytracker/src/modules/category/data/defaultCategories.ts`**
   - Export array chứa 80+ categories với icon và color

2. **Cập nhật `app_moneytracker/src/modules/transaction/screens/TransactionScreen.tsx`**
   - Thay `categoryIconOptions` = emoji → MaterialCommunityIcons
   - Export list để reuse ở chỗ khác

3. **Cập nhật `app_moneytracker/src/core/db/migrations.ts`**
   - Seed default categories khi init DB

4. **Hoặc cập nhật `app_moneytracker/src/modules/sync/service/syncService.ts`**
   - Sync default categories từ server nếu có

---

## Icon Format

```typescript
// Icon format: MaterialCommunityIcons name (string)
// Ví dụ: 'food-fork-drink', 'coffee', 'cart'

// Không dùng emoji nữa
// Cũ: icon: '🍜'
// Mới: icon: 'food-fork-drink'
```

---

## Implementation Notes

- User có thể xóa DB để reset → không cần migration
- Icon mới là MaterialCommunityIcons string, ko phải emoji
- Mỗi category có: id, name (VN), type, icon, color, isDefault=true, isHidden=false