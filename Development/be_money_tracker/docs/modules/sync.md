# sync (planned)

## 1. Purpose
Dong bo offline bang pull/push de giu du lieu client nhat quan.

## 2. Data Model
- sync_change_log: cursor_id, user_id, entity, entity_pk, op, changed_at
- sync_push_dedup: user_id, device_id, op_id, received_at

## 3. Business Logic
- Pull thay doi theo cursor va limit
- Push operations co idempotency theo (user_id, device_id, op_id)
- Xu ly conflict dua tren baseVersion

## 4. API
- GET /api/sync/pull
- POST /api/sync/push

## 5. Flow
- sync-pull-flow.md
- sync-push-flow.md

## 6. Edge Cases
- Entity khong ho tro
- Conflict version
- Request trung lap

## 7. Notes
- Chua chinh thuc, de san cho phat trien sau
