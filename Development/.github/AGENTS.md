---
description: "Agent instructions for MoneyTracker app (Expo frontend + Spring Boot backend). Use when working in this repo."
---

# MoneyTracker Agents

## Before you code
- Read backend agent rules first: [be_money_tracker/docs/rules/01_agent_rules.md](../be_money_tracker/docs/rules/01_agent_rules.md)
- Architecture and DB docs: [be_money_tracker/docs/architecture/overview.md](../be_money_tracker/docs/architecture/overview.md), [be_money_tracker/docs/database/database.md](../be_money_tracker/docs/database/database.md)
- API specs and flows: [be_money_tracker/docs/api/](../be_money_tracker/docs/api/), [be_money_tracker/docs/flows/](../be_money_tracker/docs/flows/)
- Migration plan and to-be design: [be_money_tracker/docs/to-be/](../be_money_tracker/docs/to-be/)

## Frontend (app_moneytracker)
- Run: `npm run start` or `npx expo start --dev-client`
- Platform: `npm run android`, `npm run ios`, `npm run web`
- Lint: `npm run lint`
- API base URL: [app_moneytracker/src/core/config/env.ts](../app_moneytracker/src/core/config/env.ts)
- Pattern: screen -> usecase -> repository -> datasource

## Backend (be_money_tracker)
- Run (Windows): `mvnw.cmd spring-boot:run`
- Run (macOS/Linux): `./mvnw spring-boot:run`
- Tests: `./mvnw test` (or `mvnw.cmd test`)
- Config: [be_money_tracker/src/main/resources/application.properties](../be_money_tracker/src/main/resources/application.properties)

## Conventions (backend)
- UUID for all IDs; timestamps use created_at/updated_at/deleted_at
- Monetary values use DECIMAL(18,2)
- API base path: /api
- Response format: success { data, meta }, error { error: { code, message, details } }
- Paging: page, size, sort and meta { page, size, totalItems, totalPages }
