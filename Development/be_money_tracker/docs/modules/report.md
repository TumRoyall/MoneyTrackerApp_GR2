# report

## 1. Purpose
Thong ke va phan tich chi tieu.

## 2. Data Model
- Bao cao la truy van tong hop, khong bat buoc co table rieng

## 3. Business Logic
- Xem tong quan thu - chi
- Xem thong ke theo vi
- Xem thong ke theo thoi gian
- Danh gia thoi quen chi tieu theo ngan sach
- Nhan goi y va canh bao chi tieu
- Xuat bao cao

## 4. API
- GET /api/reports/summary
- GET /api/reports/by-wallet
- GET /api/reports/by-time
- GET /api/reports/budget-health
- GET /api/reports/insights
- POST /api/reports/export

## 5. Flow
- reports-summary-flow.md
- reports-by-wallet-flow.md
- reports-by-time-flow.md
- reports-budget-health-flow.md
- reports-insights-flow.md
- reports-export-flow.md

## 6. Edge Cases
- Khong co du lieu trong khoang thoi gian

## 7. Notes
- Chi so can co: tong thu nhap, tong chi tieu, net, so giao dich, danh muc chi nhieu nhat, vi chi nhieu nhat
