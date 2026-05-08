# Sơ đồ cây màn hình của app

```text
App
├─ Root Layout: app/_layout.tsx
│  ├─ (auth)
│  │  ├─ login
│  │  ├─ register
│  │  ├─ forgot-password
│  │  ├─ reset-password
│  │  ├─ verify-email
│  │  └─ change-password
│  └─ (tabs)
│     ├─ wallets  → Trang chủ
│     ├─ transactions  → Giao dịch
│     ├─ reports  → Công cụ tiền tệ
│     │  └─ tools screen
│     │     └─ Ngân sách
│     │        ├─ budgets
│     │        ├─ budgets/[budgetId]
│     │        └─ budgets/[budgetId]/edit
│     ├─ budgets  → route ẩn trong tab layout
│     └─ settings  → Cài đặt
```

## Ghi chú

- `app/_layout.tsx` là layout gốc, chia app thành 2 nhánh chính: `auth` và `tabs`.
- Nhánh `auth` chứa toàn bộ các màn hình đăng nhập và quản lý mật khẩu.
- Nhánh `tabs` là khu vực chính sau khi vào app.
- Tab `reports` đang hiển thị nhãn là `Công cụ tiền tệ`.
- Màn hình `Ngân sách` mở từ `Công cụ tiền tệ` và dẫn tới các màn hình con:
  - danh sách ngân sách
  - chi tiết ngân sách
  - sửa ngân sách
- `budgets` là route ẩn trong tab layout nếu bạn vẫn muốn giữ điều hướng nội bộ nhưng không hiển thị ngoài thanh tab.
