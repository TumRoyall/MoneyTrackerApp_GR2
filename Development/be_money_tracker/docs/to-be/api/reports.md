# reports API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/reports/summary
- response:
  - totalIncome
  - totalExpense
  - net
  - transactionCount
  - topCategory: { categoryId, name, totalExpense }
  - topWallet: { walletId, name, totalExpense }

### GET /api/reports/by-wallet
- response:
  - wallets: [{ walletId, name, totalIncome, totalExpense, currentBalance, expenseRatio, rankByExpense }]

### GET /api/reports/by-time
- query: fromDate, toDate, groupBy (day/week/month/year)
- response:
  - series: [{ period, totalExpense, totalIncome }]
  - trend
  - peakPeriod

### GET /api/reports/budget-health
- response:
  - budgets: [{ budgetId, categoryId, spent, limit, ratio }]

### GET /api/reports/insights
- response:
  - insights: [{ code, message }]

### POST /api/reports/export
- request body: fromDate, toDate, format (json)
- response: file or download link

## Notes
- Co the mo rong chi so
