# Garden API

## Base URL
/api

## Auth
JWT Bearer token required cho tat ca endpoint.
Feature flag `feature.garden.enabled` phai la `true`.

## Endpoints

### GET /api/garden/current
- purpose: Lay trang thai hien tai cua vuon (dashboard chinh)
- request: (none — user tu JWT)
- response body (GardenCurrentResponse):
  - month (string) — "tháng 5 2026"
  - seed (GardenSeedResponse | null)
    - seedId (string)
    - name (string)
    - rarity (string: common | rare | epic | legendary)
    - description (string)
    - previewColors { petal, center, leaf }
  - score { value (int 0-100), label (string) }
  - weather (string: sunny | cloudy | rainy | stormy | glowy)
  - flower { stage (string), quality (string), progress (double 0.0-1.0) }
  - dailyStreak (int)
  - tasksCompletedToday (int)
  - tasksTotalToday (int)
  - encouragement (string)
  - rewards (list of GardenRewardResponse)

### GET /api/garden/flower-state
- purpose: Lay trang thai hoa hien tai (stage/quality/progress)
- request: (none)
- response body (GardenFlowerStateResponse):
  - stage (string: Seed | Sprout | YoungPlant | GrowingPlant | Budding | Blooming)
  - quality (string: terrible | poor | average | good | excellent)
  - progress (double 0.0-1.0)

### GET /api/garden/tasks/today
- purpose: Lay danh sach nhiem vu cua ngay hom nay
- request: (none)
- response body: list of GardenTaskResponse
  - taskId (UUID string)
  - title (string)
  - description (string)
  - xp (int)
  - completed (boolean)

### POST /api/garden/tasks/{taskId}/complete
- purpose: Hoan thanh mot nhiem vu
- request: taskId as path variable
- response body: list of GardenTaskResponse (tat ca task cua ngay, da cap nhat)
- side effects:
  - Cap nhat streak cua user
  - Cap nhat score cua PlantSession
  - Error neu task da COMPLETED hoac khong tim thay

### POST /api/garden/select-seed
- purpose: Chon hat giong cho thang hien tai
- request body (SelectSeedRequest):
  - seedId (string, required) — VD: "seed-sakura", "seed-moon", "seed-sunrise", "seed-lotus", "seed-aurora"
- response body: GardenCurrentResponse (trang thai moi cua vuon sau khi chon hat)
- side effects:
  - Tao hoac cap nhat PlantSession cho thang hien tai
  - Gan FlowerType tuong ung

### GET /api/garden/history
- purpose: Lay lich su vuon hoa (cac thang truoc)
- request: (none)
- response body: list of GardenHistoryResponse
  - month (string)
  - year (int)
  - seed (GardenSeedResponse)
  - score { value, label }
  - flower { stage, quality, progress }
  - completedAt (string ISO timestamp)

### GET /api/garden/month-report
- purpose: Bao cao thang hien tai (timeline, diem, thanh tuu)
- request: (none)
- response body (GardenMonthReportResponse):
  - month (string)
  - year (int)
  - seed (GardenSeedResponse)
  - finalScore { value, label }
  - savingsRate (double 0.0-1.0)
  - spendingChange (double)
  - achievements (list of string)
  - replay (list of ReplayEntry)
    - stage (string)
    - quality (string)
    - day (int — ngay trong thang)

## Error Format
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Task not found",
    "details": { "path": "/api/garden/tasks/xxx/complete", "method": "POST" },
    "timestamp": "2026-05-13T07:00:00Z"
  }
}
```

## Notes
- Weather duoc tinh tu score: >=80 glowy, >=60 sunny, >=40 cloudy, >=20 rainy, <20 stormy
- Stage duoc tinh tu progress (% ngay trong thang) + score
- Quality duoc tinh tu score: >=80 excellent, >=60 good, >=40 average, >=20 poor, <20 terrible
- Daily tasks duoc auto-generate neu chua co khi user request GET /tasks/today
- PlantSession la 1 per user per month, unique constraint (user_id, month_start)
