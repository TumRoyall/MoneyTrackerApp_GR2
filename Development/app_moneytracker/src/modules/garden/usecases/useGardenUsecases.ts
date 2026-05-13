import { useMemo } from 'react';

import { GardenRemoteDataSourceImpl } from '@/modules/garden/api/gardenRemoteDataSourceImpl';
import { GardenRemoteDataSourceMock } from '@/modules/garden/api/gardenRemoteDataSourceMock';
import { GardenRemoteDataSourceWithFallback } from '@/modules/garden/api/gardenRemoteDataSourceWithFallback';
import { GardenRepositoryImpl } from '@/modules/garden/repository/gardenRepositoryImpl';
import { createGardenUsecases } from '@/modules/garden/usecases/gardenUsecases';

export const useGardenUsecases = () => {
  const repository = useMemo(() => {
    const remote = new GardenRemoteDataSourceImpl();
    const fallback = new GardenRemoteDataSourceMock();
    const dataSource = new GardenRemoteDataSourceWithFallback(remote, fallback);
    return new GardenRepositoryImpl(dataSource);
  }, []);

  return useMemo(() => createGardenUsecases(repository), [repository]);
};
