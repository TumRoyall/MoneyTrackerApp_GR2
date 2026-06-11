import { useMemo } from 'react';

import { AiRemoteDataSourceImpl } from '@/modules/ai/api/aiRemoteDataSourceImpl';
import { AiRepositoryImpl } from '@/modules/ai/repository/aiRepositoryImpl';
import { createAiUsecases } from '@/modules/ai/usecases/aiUsecases';

export const useAiUsecases = () => {
  const repository = useMemo(() => new AiRepositoryImpl(new AiRemoteDataSourceImpl()), []);
  return useMemo(() => createAiUsecases(repository), [repository]);
};
