# data management API

## Base URL
/api

## Endpoints

### POST /api/data/backup
- purpose: sao luu du lieu ca nhan
- response:
  - backupId (UUID)
  - status (string)

### POST /api/data/restore
- purpose: khoi phuc du lieu ca nhan
- request body:
  - backupId (UUID)
- response:
  - status (string)

### GET /api/data/export
- purpose: xuat du lieu ca nhan
- response:
  - download link hoac file stream (json)

## Notes
- Backup luu tren cloud
- Export dinh dang JSON, khong can ma hoa
