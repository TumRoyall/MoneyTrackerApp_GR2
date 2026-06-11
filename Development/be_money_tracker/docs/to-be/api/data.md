# data management API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/sync/pull
- query: cursor, limit
- response: { data: SyncPull }

### POST /api/sync/push
- request body: SyncPushRequest
- response: { data: SyncPushResponse }

### POST /api/data/backup
- response: { data: { backupId, status } }

### POST /api/data/restore
- request body: backupId
- response: { data: { status } }

### GET /api/data/export
- response: json file or link

## Notes
- Backup cloud, export JSON
- DB column dung cursor_id (tranh tu khoa cursor)
