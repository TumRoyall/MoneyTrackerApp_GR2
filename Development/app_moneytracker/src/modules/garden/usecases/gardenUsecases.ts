import { GardenFlowerSelectionInput } from '@/modules/garden/models/garden.types';
import { GardenRepository } from '@/modules/garden/repository/gardenRepository';

export const createGardenUsecases = (repository: GardenRepository) => ({
  getCurrentGarden: () => repository.getCurrentGarden(),
  getGardenHistory: () => repository.getGardenHistory(),
  getMonthReport: () => repository.getMonthReport(),
  selectSeed: (payload: GardenFlowerSelectionInput) => repository.selectSeed(payload),
  getTodayTasks: () => repository.getTodayTasks(),
  completeTask: (taskId: string) => repository.completeTask(taskId),
  getFlowerState: () => repository.getFlowerState(),
});
