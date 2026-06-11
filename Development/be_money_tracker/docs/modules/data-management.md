# data-management

## 1. Purpose
Quan ly du lieu ca nhan: dong bo, sao luu, khoi phuc, xuat du lieu.

## 2. Data Model
- sync_change_log
- sync_push_dedup
- data_backups (planned)

## 3. Business Logic
- Dong bo du lieu voi may chu
- Sao luu du lieu ca nhan
- Khoi phuc du lieu ca nhan
- Xuat du lieu ca nhan

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
- Khong du quyen truy cap du lieu
- Backup/restore that bai

## 7. Notes
- Backup luu tren cloud
- Export dinh dang JSON, khong can ma hoa
