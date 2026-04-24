# MoneyTracker Mobile

Ung dung mobile React Native + Expo + TypeScript.

- Phase 1: online-first, goi backend REST API
- Phase 2: them local database + sync (chua implement)

## Yeu cau
- Node.js LTS
- npm (hoac pnpm/yarn)
- Expo Go (neu chay tren Android/iOS)

## Cai dat
```bash
npm install
```

## Cau hinh API
Sua base URL cua backend tai file:

- [src/core/config/env.ts](src/core/config/env.ts)

```ts
export const ENV = {
	apiBaseUrl: 'http://localhost:8080',
	appName: 'MoneyTracker',
};
```

Neu dung emulator Android, co the can doi `localhost` thanh `10.0.2.2`.

## Chay ung dung
```bash
npm run start
```

Tuy chon:
```bash
npm run android
npm run ios
npm run web
```

## Cau truc du an
- `app/`: expo-router routes
- `src/core/`: config, http client, storage
- `src/modules/`: feature modules (auth, wallet, category, ...)
- UI khong goi API truc tiep (screen -> usecase -> repository -> datasource)

## Notes
- Auth module da duoc implement theo API hien tai.
- Repository pattern da san sang de sau nay them local DB + sync.
