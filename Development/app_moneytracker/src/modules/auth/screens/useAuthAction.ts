import { useCallback, useState } from 'react';

import { getAuthErrorMessage } from '@/modules/auth/utils/authError';

interface AuthActionState<T> {
  data?: T;
  error?: string;
  loading: boolean;
  success: boolean;
}

export const useAuthAction = <TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) => {
  const [state, setState] = useState<AuthActionState<TResult>>({
    data: undefined,
    error: undefined,
    loading: false,
    success: false,
  });

  const run = useCallback(
    async (...args: TArgs) => {
      setState({ data: undefined, error: undefined, loading: true, success: false });
      try {
        const data = await action(...args);
        setState({ data, error: undefined, loading: false, success: true });
        return data;
      } catch (error) {
        setState({ data: undefined, error: getAuthErrorMessage(error), loading: false, success: false });
        throw error;
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setState({ data: undefined, error: undefined, loading: false, success: false });
  }, []);

  return {
    ...state,
    run,
    reset,
  };
};
