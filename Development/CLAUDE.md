# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoneyTracker is a full-stack mobile expense tracking application with two main components:
- **`be_money_tracker/`** - Spring Boot backend (API server)
- **`app_moneytracker/`** - Expo/React Native mobile app

## Development Commands

### Backend (be_money_tracker)
```bash
cd be_money_tracker
./mvnw spring-boot:run          # Start the server (port 8080)
./mvnw test                      # Run all tests
./mvnw test -Dtest=ClassName     # Run single test class
./mvnw package                   # Build JAR file
```

### Frontend (app_moneytracker)
```bash
cd app_moneytracker
npx expo start                    # Start Metro bundler
npx expo run:android              # Run on Android
npx expo run:ios                  # Run on iOS
npx expo lint                     # Run ESLint
```

### Database
- Backend uses MySQL (`localhost:3306/moneytracker_app`)
- HBM auto-update schema (`spring.jpa.hibernate.ddl-auto=update`)
- Mobile app uses local SQLite via expo-sqlite for offline support

## Architecture

### Backend - Clean Architecture
```
Controller → Service → Repository → Database
```

**Core modules** (in `com.examples.moneytracker`):
- `auth` - JWT authentication, email verification, password reset
- `user` - User profile management
- `wallet` - Virtual wallets with balance tracking
- `transaction` - Income/expense transactions with wallet balance updates
- `category` - Transaction categories (INCOME/EXPENSE types)
- `budget` - Budget limits per category with alerts
- `report` - Summary reports, spending by wallet/time/category
- `sync` - Push/pull data synchronization with deduplication
- `ai` - Intent detection for AI-powered features
- `event` - Shared expense events with group members
- `streak` - Daily logging streaks and achievements

### Frontend - Feature Modules
Each module in `app_moneytracker/src/modules/` follows a consistent structure:
- `api/` - Remote data source (API calls)
- `repository/` - Repository interface + implementation
- `usecases/` - Business logic hooks
- `screens/` - UI screens
- `models/` - TypeScript types

**Core infrastructure** (`app_moneytracker/src/core/`):
- `api/httpClient.ts` - Axios client with JWT interceptors and auto-sync trigger
- `db/` - SQLite initialization and migrations
- `storage/` - Token, wallet, device storage
- `config/env.ts` - API base URL configuration

**Navigation**: Uses `expo-router` with file-based routing:
- `app/(auth)/` - Authentication screens
- `app/(tabs)/` - Main tab navigation
- `app/ai-companion.tsx` - AI companion screen

**State Management**: TanStack Query (react-query) for server state + Zustand for local UI state

## Critical Development Rules

**Document-first workflow** (from `docs/rules/00_mandatory_workflow.md`):
1. Write design → `docs/modules/<feature>.md`
2. Confirm logic → `docs/flows/<feature>-flow.md`
3. Design API → `docs/api/<feature>.md`
4. Update database docs
5. Log decisions → `docs/decisions/decision-log.md`
6. THEN code

**Agent rules** (from `docs/rules/01_agent_rules.md`):
- MUST read all docs before writing code
- MUST follow existing architecture, database, and API definitions
- MUST NOT code without existing documentation
- MUST NOT modify DB structure or API contracts without documentation
- All code changes must match documentation 100%

## API Conventions

- Base URL: `/api`
- Success response: `{ data, meta }` (with pagination via `PageMeta`)
- Error response: `{ error: { code, message, details } }`
- Protected endpoints require JWT Bearer token
- Server runs on `localhost:8080` by default

## Configuration

- Backend config: `be_money_tracker/src/main/resources/application.properties`
- Mobile API URL: `app_moneytracker/src/core/config/env.ts` (`apiBaseUrl`)
- Default mobile API: `http://192.168.2.32:8080`
