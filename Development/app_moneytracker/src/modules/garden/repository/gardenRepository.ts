import {
  GardenCurrentState,
  GardenFlowerSelectionInput,
  GardenFlowerState,
  GardenHistoryItem,
  GardenMonthlyReport,
  GardenTask,
} from '@/modules/garden/models/garden.types';

export interface GardenRepository {
  getCurrentGarden(): Promise<GardenCurrentState>;
  getGardenHistory(): Promise<GardenHistoryItem[]>;
  getMonthReport(): Promise<GardenMonthlyReport>;
  selectSeed(payload: GardenFlowerSelectionInput): Promise<GardenCurrentState>;
  getTodayTasks(): Promise<GardenTask[]>;
  completeTask(taskId: string): Promise<GardenTask[]>;
  getFlowerState(): Promise<GardenFlowerState>;
}
