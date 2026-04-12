# sync API (planned)

## Base URL
/api

## Endpoints

### GET /api/sync/pull
- purpose: pull thay doi theo cursor
- query:
  - cursor (number, default 0)
  - limit (number, default 500, max 1000)
- response body (SyncPullResponse):
  - nextCursor (number)
  - hasMore (boolean)
  - changes (map: entity -> list of records)
  - deletes (map: entity -> list of UUID)

### POST /api/sync/push
- purpose: push thay doi offline
- request body (SyncPushRequest):
  - deviceId (string)
  - clientTime (number)
  - operations (array of SyncOperation)
    - outboxId (number)
    - requestId (string, UUID)
    - entity (wallets, categories, transactions, budgets, user_profiles)
    - entityId (string, UUID)
    - op (UPSERT, DELETE)
    - baseVersion (number, optional)
    - data (object, optional)
    - deletedAt (number, optional)
- response body (SyncPushResponse):
  - results (array of SyncOperationResult)
    - outboxId, requestId, status (ok, conflict, error)
    - newVersion, serverVersion, serverData, error

## Notes
- Planned feature, chua chinh thuc
- JWT required
- DB column dung cursor_id (tranh tu khoa cursor)
