# Financial Garden Module

## 1. Purpose
Module gamification giup user duy tri thoi quen tai chinh tot.
User trong hoa moi thang, hoa se lon va no dua tren diem cham soc tai chinh.

## 2. Data Model

### Entities chinh
- **FlowerType**: Loai hoa (SAKURA, LILY, SUNFLOWER, ROSE, TULIP, LAVENDER)
- **PlantSession**: Phien trong hoa 1 thang, luu trang thai hien tai (stage, quality, score)
- **DailyFinancialTask**: Nhiem vu tai chinh hang ngay (ghi chi tieu, tiet kiem, xem ngan sach...)
- **PlantStageSnapshot**: Chup nhanh trang thai hoa moi ngay → dung de render growth timeline
- **UserGardenStreak**: Chuoi ngay lien tuc hoan thanh nhiem vu
- **GardenReward**: Phan thuong dac biet (XP, cosmetic, score boost, streak bonus, mutation)

### Quan he
- PlantSession → FlowerType (ManyToOne)
- DailyFinancialTask → PlantSession (ManyToOne)
- PlantStageSnapshot → PlantSession (ManyToOne)
- GardenReward → PlantSession (ManyToOne)
- Tat ca entity → users (FK user_id)

### Enum
- FlowerStage: SEED → SPROUT → YOUNG_PLANT → GROWING_PLANT → BUDDING → BLOOMING_FLOWER
- FlowerQuality: TERRIBLE → POOR → AVERAGE → GOOD → EXCELLENT
- PlantSessionStatus: ACTIVE → FINALIZED → ARCHIVED
- FinancialTaskType: NO_UNNECESSARY_SPENDING, SAVE_MONEY, LOG_ALL_TRANSACTIONS, REVIEW_BUDGETS, AVOID_FOOD_DELIVERY, REPAY_DEBT, SPEND_STABILITY, BONUS_RANDOM
- FinancialTaskStatus: PENDING → COMPLETED | SKIPPED
- GardenRewardType: XP, COSMETIC, SCORE_BOOST, STREAK_BONUS, MUTATION_UNLOCK
- GardenMutationType: NONE, GOLDEN, CRYSTAL, GALAXY
- GardenRank: SEEDLING, BRONZE, SILVER, GOLD, PLATINUM

## 3. Business Logic

### Score Engine
- Base score = 50
- Cong/tru diem dua tren cac rule: savings ratio, budget compliance, spending stability, task completion, debt management
- Score 0-100, clamp

### Stage Resolution
- Dua tren progress (% ngay trong thang): SEED(<10%) → SPROUT(<25%) → YOUNG_PLANT(<45%) → GROWING_PLANT(<65%) → BUDDING(<85%) → BLOOMING(>=85% AND score>=50)

### Quality Resolution
- Dua tren score: excellent(>=80) → good(>=60) → average(>=40) → poor(>=20) → terrible(<20)

### Weather Resolution
- Dua tren score: glowy(>=80) → sunny(>=60) → cloudy(>=40) → rainy(>=20) → stormy(<20)

### Daily Task Generation
- Tu dong tao 3-4 nhiem vu khi user request GET /tasks/today neu chua co
- Core tasks: LOG_ALL_TRANSACTIONS, NO_UNNECESSARY_SPENDING, REVIEW_BUDGETS
- Random bonus task (40% chance): BONUS_RANDOM

### Streak Tracking
- Dem so ngay lien tuc co hoan thanh it nhat 1 task
- Reset neu gap ngay chua hoan thanh (gap > 1 ngay)

### Feature Guard
- Config: `feature.garden.enabled=true/false`
- Interceptor chặn tat ca /api/garden/** neu disabled

## 4. API
Xem docs/api/garden.md

## 5. Flow

### Flow chinh:
```
User mo app
  → GET /garden/current
    → Backend tinh score tu transactions/budgets
    → Resolve stage/quality/weather tu score + progress
    → Tra ve trang thai day du

User chon hat
  → POST /garden/select-seed
    → Tao/cap nhat PlantSession
    → Tra ve GardenCurrentState moi

User xem nhiem vu
  → GET /garden/tasks/today
    → Auto-generate neu chua co
    → Tra ve danh sach tasks

User hoan thanh nhiem vu
  → POST /garden/tasks/{id}/complete
    → Cap nhat task status
    → Cap nhat streak
    → Cap nhat plant session score
    → Tra ve danh sach tasks (da cap nhat)

User xem bao cao thang
  → GET /garden/month-report
    → Tinh score, lay snapshots lam replay
    → Generate achievements
```

## 6. Edge Cases
- User chua chon hat → tra ve default seed (Sakura)
- User chua co PlantSession → tra ve Seed stage, average quality
- Task da completed → error "Task already completed"
- Invalid seedId → error "Invalid seedId"
- Feature disabled → 400 "Financial Garden feature is disabled"
- Khong co snapshot → replay chi co 1 entry la trang thai hien tai

## 7. Notes
- Frontend hien tai dung mock data (GardenRemoteDataSourceMock) voi fallback. Backend API duoc ket noi qua GardenRemoteDataSourceImpl.
- Score engine dung transaction data thuc tu module transaction.
- Seed catalog la static data, match giua FE (seedCatalog.ts) va BE (SEED_CATALOG trong GardenService).
- DB migration: chay databaseGarden.sql
