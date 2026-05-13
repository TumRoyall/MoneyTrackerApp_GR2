import {
  GardenCurrentState,
  GardenFlowerSelectionInput,
  GardenFlowerState,
  GardenHistoryItem,
  GardenMonthlyReport,
  GardenTask,
} from '@/modules/garden/models/garden.types';
import { GardenRemoteDataSource } from '@/modules/garden/api/gardenRemoteDataSource';
import { gardenMockStore } from '@/modules/garden/storage/gardenMockStore';

export class GardenRemoteDataSourceMock implements GardenRemoteDataSource {
  async getCurrentGarden(): Promise<GardenCurrentState> {
    return gardenMockStore.getCurrent();
  }

  async getGardenHistory(): Promise<GardenHistoryItem[]> {
    return gardenMockStore.getHistory();
  }

  async getMonthReport(): Promise<GardenMonthlyReport> {
    return gardenMockStore.getReport();
  }

  async selectSeed(payload: GardenFlowerSelectionInput): Promise<GardenCurrentState> {
    return gardenMockStore.selectSeed(payload.seedId);
  }

  async getTodayTasks(): Promise<GardenTask[]> {
    return gardenMockStore.getTasks();
  }

  async completeTask(taskId: string): Promise<GardenTask[]> {
    return gardenMockStore.completeTask(taskId);
  }

  async getFlowerState(): Promise<GardenFlowerState> {
    return gardenMockStore.getFlowerState();
  }
}
