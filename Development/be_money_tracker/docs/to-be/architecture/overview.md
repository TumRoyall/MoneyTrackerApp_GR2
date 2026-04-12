# Kien truc TO-BE

## Muc tieu
- Clean Architecture
- Module boundary ro rang
- Dinh nghia hop dong giua cac layer

## Layering
- Domain: Entity, Value Object, Policy
- Use Case: Application services, orchestration
- Interface Adapter: Controller, DTO mapper
- Infrastructure: DB, mail, JWT, external service

## Modules
- transaction
- wallet
- category
- user
- auth
- budget
- report
- data-management
- ai-assistant (planned)

## Quy uoc chung
- API base: /api
- Response format:
  - Success: { data, meta }
  - Error: { error: { code, message, details } }
- JWT cho endpoint can bao ve

## Luong xu ly chuan
Client -> Controller -> Use Case -> Repository -> DB
