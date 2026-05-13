import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import {
  GardenCurrentState,
  GardenFlowerSelectionInput,
  GardenFlowerState,
  GardenHistoryItem,
  GardenMonthlyReport,
  GardenTask,
} from '@/modules/garden/models/garden.types';
import { GardenRemoteDataSource } from '@/modules/garden/api/gardenRemoteDataSource';

export class GardenRemoteDataSourceImpl implements GardenRemoteDataSource {
  async getCurrentGarden(): Promise<GardenCurrentState> {
    const response = await httpClient.get<ApiResponse<GardenCurrentState>>('/api/garden/current');
    return response.data.data;
  }

  async getGardenHistory(): Promise<GardenHistoryItem[]> {
    const response = await httpClient.get<ApiResponse<GardenHistoryItem[]>>('/api/garden/history');
    return response.data.data;
  }

  async getMonthReport(): Promise<GardenMonthlyReport> {
    const response = await httpClient.get<ApiResponse<GardenMonthlyReport>>('/api/garden/month-report');
    return response.data.data;
  }

  async selectSeed(payload: GardenFlowerSelectionInput): Promise<GardenCurrentState> {
    const response = await httpClient.post<ApiResponse<GardenCurrentState>>(
      '/api/garden/select-seed',
      payload,
    );
    return response.data.data;
  }

  async getTodayTasks(): Promise<GardenTask[]> {
    const response = await httpClient.get<ApiResponse<GardenTask[]>>('/api/garden/tasks/today');
    return response.data.data;
  }

  async completeTask(taskId: string): Promise<GardenTask[]> {
    const response = await httpClient.post<ApiResponse<GardenTask[]>>(
      `/api/garden/tasks/${taskId}/complete`,
    );
    return response.data.data;
  }

  async getFlowerState(): Promise<GardenFlowerState> {
    const response = await httpClient.get<ApiResponse<GardenFlowerState>>('/api/garden/flower-state');
    return response.data.data;
  }
}
