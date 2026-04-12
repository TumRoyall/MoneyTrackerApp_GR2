import { useMemo } from 'react';

import { AuthRemoteDataSource } from '@/modules/auth/api/authRemoteDataSource';
import { AuthRepositoryImpl } from '@/modules/auth/repository/authRepositoryImpl';
import { createAuthUsecases } from '@/modules/auth/usecases/authUsecases';

export const useAuthUsecases = () => {
  const repository = useMemo(() => new AuthRepositoryImpl(new AuthRemoteDataSource()), []);
  return useMemo(() => createAuthUsecases(repository), [repository]);
};
