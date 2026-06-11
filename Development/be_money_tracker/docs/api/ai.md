# ai API (MVP)

## Base URL
/api

## Response envelope
All endpoints return:
- data: payload
- meta: pagination (only for list endpoints)

## POST /api/ai/action
- purpose: detect intent and return structured result + short response
- request body (AiActionRequest):
  - text (string, required)

### Example: log transaction
request:
```json
{
  "text": "an pho 45k"
}
```
response:
```json
{
  "data": {
    "intent": "LOG_TRANSACTION",
    "structuredResult": {
      "transactionId": "2d2f9228-1f03-4e88-9d0a-c1e6c3d1b8e0",
      "amount": 45000,
      "categoryId": "cba2a5a0-2f1c-4ff2-84f5-27d4f0f2b2bd"
    },
    "message": "Da ghi nhan 45k cho bua an nhe.",
    "meta": {
      "intentConfidence": 0.7,
      "aiProvider": "gemini",
      "aiFallbackUsed": false,
      "suggestions": []
    }
  },
  "meta": null
}
```

### Example: spending query
request:
```json
{
  "text": "minh tieu nhieu nhat vao gi thang nay?"
}
```
response:
```json
{
  "data": {
    "intent": "SPENDING_QUERY",
    "structuredResult": {
      "summary": {
        "periodStart": "2026-05-01",
        "periodEnd": "2026-05-19",
        "totalIncome": 12000000,
        "totalExpense": 3500000,
        "topCategoryName": "An uong",
        "topCategoryAmount": 1200000
      }
    },
    "message": "Thang nay ban chi nhieu nhat vao An uong.",
    "meta": {
      "intentConfidence": 0.85,
      "aiProvider": "gemini",
      "aiFallbackUsed": false,
      "suggestions": []
    }
  },
  "meta": null
}
```

### Example: budget query
request:
```json
{
  "text": "minh con bao nhieu budget an uong?"
}
```
response:
```json
{
  "data": {
    "intent": "BUDGET_QUERY",
    "structuredResult": {
      "budgetId": "c12e1e49-2c1a-430a-9556-2c1db0a6c4fd",
      "remaining": 250000,
      "categoryId": "cba2a5a0-2f1c-4ff2-84f5-27d4f0f2b2bd"
    },
    "message": "Con lai 250000 cho budget an uong.",
    "meta": {
      "intentConfidence": 0.9,
      "aiProvider": "gemini",
      "aiFallbackUsed": false,
      "suggestions": []
    }
  },
  "meta": null
}
```

### Example: insight generation
request:
```json
{
  "text": "co insight gi gan day khong?"
}
```
response:
```json
{
  "data": {
    "intent": "INSIGHT_REQUEST",
    "structuredResult": {
      "insights": [
        {
          "type": "WEEKEND_SPIKE",
          "severity": "MEDIUM",
          "message": "Ban chi nhieu hon vao cuoi tuan."
        }
      ]
    },
    "message": "Ban chi nhieu hon vao cuoi tuan.",
    "meta": {
      "intentConfidence": 0.8,
      "aiProvider": "gemini",
      "aiFallbackUsed": false,
      "suggestions": []
    }
  },
  "meta": null
}
```

## GET /api/analytics/summary
- purpose: monthly summary for a given date
- query params:
  - date (YYYY-MM-DD, optional)

### Example response
```json
{
  "data": {
    "periodStart": "2026-05-01",
    "periodEnd": "2026-05-19",
    "totalIncome": 12000000,
    "totalExpense": 3500000,
    "topCategoryName": "An uong",
    "topCategoryAmount": 1200000
  },
  "meta": null
}
```

## GET /api/behavior/signals
- purpose: detect behavior signals
- query params:
  - from (YYYY-MM-DD, optional)
  - to (YYYY-MM-DD, optional)

### Example response
```json
{
  "data": [
    {
      "type": "WEEKEND_SPIKE",
      "severity": "MEDIUM",
      "windowStart": "2026-04-19",
      "windowEnd": "2026-05-19",
      "evidence": "weekend_spend=1200000, weekday_spend=800000"
    }
  ],
  "meta": null
}
```

## GET /api/insights
- purpose: list insights derived from signals
- query params:
  - from (YYYY-MM-DD, optional)
  - to (YYYY-MM-DD, optional)

### Example response
```json
{
  "data": [
    {
      "type": "WEEKEND_SPIKE",
      "severity": "MEDIUM",
      "message": "Ban chi nhieu hon vao cuoi tuan."
    }
  ],
  "meta": null
}
```

## Notes
- JWT required for all endpoints
- If Gemini is unavailable, responses still return structuredResult and a deterministic fallback message
