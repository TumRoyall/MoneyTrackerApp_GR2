# Kien truc he thong

## Pham vi (hien tai)
- Backend quan ly chi tieu ca nhan
- Trong scope: transaction, wallet, category, user/auth, budget, report
- AI assistant chua can (planned)
- Quan ly du lieu ca nhan: sync, backup, restore, export

## Tech stack
- Spring Boot
- PostgreSQL
- React Native (client)

## API
- Base URL: /api
- Auth: JWT Bearer token

## Kieu kien truc
- Hien tai: layered monolith (Controller -> Service -> Repository -> DB)
- Muc tieu sau: clean architecture (domain/use-case/adapter), chua ap dung

## Modules
- transaction
- wallet
- category
- user/auth
- budget
- report
- data-management (sync, backup, restore, export)
- ai-assistant (planned)

## Cross-cutting
- Error handling: GlobalExceptionHandler (dinh nghia format error trong API docs)
- CORS: cau hinh trong WebConfig

## Flow
Client -> Controller -> Service -> Repository -> DB