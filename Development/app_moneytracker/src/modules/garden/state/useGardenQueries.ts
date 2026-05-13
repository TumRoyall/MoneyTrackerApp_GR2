import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GardenFlowerSelectionInput } from '@/modules/garden/models/garden.types';
import { gardenQueryKeys } from '@/modules/garden/state/gardenQueryKeys';
import { useGardenUsecases } from '@/modules/garden/usecases';

export const useGardenQueries = () => {
  const usecases = useGardenUsecases();
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: gardenQueryKeys.current,
    queryFn: usecases.getCurrentGarden,
  });

  const tasksQuery = useQuery({
    queryKey: gardenQueryKeys.tasks,
    queryFn: usecases.getTodayTasks,
  });

  const historyQuery = useQuery({
    queryKey: gardenQueryKeys.history,
    queryFn: usecases.getGardenHistory,
  });

  const reportQuery = useQuery({
    queryKey: gardenQueryKeys.report,
    queryFn: usecases.getMonthReport,
  });

  const flowerStateQuery = useQuery({
    queryKey: gardenQueryKeys.flowerState,
    queryFn: usecases.getFlowerState,
  });

  const selectSeedMutation = useMutation({
    mutationFn: (payload: GardenFlowerSelectionInput) => usecases.selectSeed(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(gardenQueryKeys.current, data);
      queryClient.invalidateQueries({ queryKey: gardenQueryKeys.flowerState });
      queryClient.invalidateQueries({ queryKey: gardenQueryKeys.tasks });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => usecases.completeTask(taskId),
    onSuccess: (data) => {
      queryClient.setQueryData(gardenQueryKeys.tasks, data);
      queryClient.invalidateQueries({ queryKey: gardenQueryKeys.current });
      queryClient.invalidateQueries({ queryKey: gardenQueryKeys.flowerState });
    },
  });

  return {
    currentQuery,
    tasksQuery,
    historyQuery,
    reportQuery,
    flowerStateQuery,
    selectSeedMutation,
    completeTaskMutation,
  };
};
