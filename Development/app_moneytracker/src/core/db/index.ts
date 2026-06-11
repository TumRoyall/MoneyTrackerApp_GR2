import { runMigrations } from '@/core/db/migrations';

let initialized = false;

export const initDatabase = async () => {
  if (initialized) {
    return;
  }
  await runMigrations();
  initialized = true;
};
