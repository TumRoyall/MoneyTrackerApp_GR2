import {
  GardenFlowerSelectionInput,
  GardenTask,
} from '@/modules/garden/models/garden.types';
import { GardenRemoteDataSource } from '@/modules/garden/api/gardenRemoteDataSource';
import { GardenRepository } from '@/modules/garden/repository/gardenRepository';

export class GardenRepositoryImpl implements GardenRepository {
  constructor(private readonly remote: GardenRemoteDataSource) {}

  async getCurrentGarden() {
    return this.remote.getCurrentGarden();
  }

  async getGardenHistory() {
    return this.remote.getGardenHistory();
  }

  async getMonthReport() {
    return this.remote.getMonthReport();
  }

  async selectSeed(payload: GardenFlowerSelectionInput) {
    return this.remote.selectSeed(payload);
  }

  async getTodayTasks(): Promise<GardenTask[]> {
    return this.remote.getTodayTasks();
  }

  async completeTask(taskId: string) {
    return this.remote.completeTask(taskId);
  }

  async getFlowerState() {
    return this.remote.getFlowerState();
  }
}
