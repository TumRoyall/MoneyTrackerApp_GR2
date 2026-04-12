# report (TO-BE)

## 1. Purpose
Thong ke va phan tich chi tieu.

## 2. Data Model
- Tong hop tu transactions, wallets, categories, budgets

## 3. Business Logic
- Tong quan thu - chi
- Thong ke theo vi
- Thong ke theo thoi gian
- Danh gia ngan sach
- Goi y va canh bao
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
- Chi so chuan: totalIncome, totalExpense, net, transactionCount, topCategory, topWallet
