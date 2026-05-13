import {
  GardenCurrentState,
  GardenFlowerSelectionInput,
  GardenFlowerState,
  GardenHistoryItem,
  GardenMonthlyReport,
  GardenTask,
} from '@/modules/garden/models/garden.types';
import { GardenRemoteDataSource } from '@/modules/garden/api/gardenRemoteDataSource';

export class GardenRemoteDataSourceWithFallback implements GardenRemoteDataSource {
  constructor(
    private readonly remote: GardenRemoteDataSource,
    private readonly fallback: GardenRemoteDataSource,
  ) {}

  private async withFallback<T>(action: () => Promise<T>, fallbackAction: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch {
      return fallbackAction();
    }
  }

  async getCurrentGarden(): Promise<GardenCurrentState> {
    return this.withFallback(() => this.remote.getCurrentGarden(), () => this.fallback.getCurrentGarden());
  }

  async getGardenHistory(): Promise<GardenHistoryItem[]> {
    return this.withFallback(() => this.remote.getGardenHistory(), () => this.fallback.getGardenHistory());
  }

  async getMonthReport(): Promise<GardenMonthlyReport> {
    return this.withFallback(() => this.remote.getMonthReport(), () => this.fallback.getMonthReport());
  }

  async selectSeed(payload: GardenFlowerSelectionInput): Promise<GardenCurrentState> {
    return this.withFallback(() => this.remote.selectSeed(payload), () => this.fallback.selectSeed(payload));
  }

  async getTodayTasks(): Promise<GardenTask[]> {
    return this.withFallback(() => this.remote.getTodayTasks(), () => this.fallback.getTodayTasks());
  }

  async completeTask(taskId: string): Promise<GardenTask[]> {
    return this.withFallback(() => this.remote.completeTask(taskId), () => this.fallback.completeTask(taskId));
  }

  async getFlowerState(): Promise<GardenFlowerState> {
    return this.withFallback(() => this.remote.getFlowerState(), () => this.fallback.getFlowerState());
  }
}
