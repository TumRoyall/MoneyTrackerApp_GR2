import { useEffect } from 'react';
import { tokenStorage } from '@/core/storage/tokenStorage';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

export const useSyncBootstrap = () => {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await syncService.ensureInitialized();
        const token = await tokenStorage.getAccessToken();
        if (!token || cancelled) {
          return;
        }
        await syncService.syncOnce();
      } catch {
        // silent fail
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);
};
