# reports API

## Base URL
/api

## Endpoints

### GET /api/reports/summary
- purpose: tong quan thu - chi
- query:
  - fromDate (YYYY-MM-DD, optional)
  - toDate (YYYY-MM-DD, optional)
 - response:
  - totalIncome
  - totalExpense
  - net
  - transactionCount
  - topCategory: { categoryId, name, totalExpense }
  - topWallet: { walletId, name, totalExpense }

### GET /api/reports/by-wallet
- purpose: thong ke theo vi
- query:
  - fromDate (YYYY-MM-DD, optional)
  - toDate (YYYY-MM-DD, optional)
 - response:
  - wallets: [{ walletId, name, totalIncome, totalExpense, currentBalance, expenseRatio, rankByExpense }]

### GET /api/reports/by-time
- purpose: thong ke theo thoi gian
- query:
  - fromDate (YYYY-MM-DD, required)
  - toDate (YYYY-MM-DD, required)
  - groupBy (day, week, month)
 - response:
  - series: [{ period, totalExpense, totalIncome }]
  - trend: up/down/flat
  - peakPeriod

### GET /api/reports/budget-health
- purpose: danh gia thoi quen chi tieu theo ngan sach
- query:
  - fromDate (YYYY-MM-DD, optional)
  - toDate (YYYY-MM-DD, optional)

### GET /api/reports/insights
- purpose: goi y va canh bao chi tieu
- query:
  - fromDate (YYYY-MM-DD, optional)
  - toDate (YYYY-MM-DD, optional)

### POST /api/reports/export
- purpose: xuat bao cao
- request body:
  - fromDate (YYYY-MM-DD)
  - toDate (YYYY-MM-DD)
  - format (csv, pdf)

## Notes
- Chi so hien tai theo danh sach yeu cau, co the mo rong sau
