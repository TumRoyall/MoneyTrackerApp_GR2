# data-management (TO-BE)

## 1. Purpose
Quan ly dong bo, sao luu, khoi phuc, xuat du lieu.

## 2. Data Model
- sync_change_log
- sync_push_dedup
- data_backups (cloud)

## 3. Business Logic
- Dong bo du lieu
- Sao luu du lieu
- Khoi phuc du lieu
- Xuat du lieu (JSON)

## 4. API
- GET /api/sync/pull
- POST /api/sync/push
- POST /api/data/backup
- POST /api/data/restore
- GET /api/data/export

## 5. Flow
- sync-pull-flow.md
- sync-push-flow.md
- data-backup-flow.md
- data-restore-flow.md
- data-export-flow.md

## 6. Edge Cases
- Backup that bai

## 7. Notes
- Backup cloud, export JSON
