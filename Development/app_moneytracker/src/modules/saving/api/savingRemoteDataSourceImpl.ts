import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import {
  Saving,
  SavingCreateInput,
  SavingUpdateInput,
} from '@/modules/saving/models/saving.types';
import { SavingRemoteDataSource } from '@/modules/saving/api/savingRemoteDataSource';

const normalizeSaving = (item: Saving): Saving => ({
  ...item,
  targetAmount: Number(item.targetAmount ?? 0),
  currentBalance: item.currentBalance == null ? null : Number(item.currentBalance),
});

export class SavingRemoteDataSourceImpl implements SavingRemoteDataSource {
  async getSavings(): Promise<Saving[]> {
    const response = await httpClient.get<ApiResponse<Saving[]>>('/api/savings');
    return response.data.data.map(normalizeSaving);
  }

  async getSaving(savingId: string): Promise<Saving | null> {
    const response = await httpClient.get<ApiResponse<Saving>>(`/api/savings/${savingId}`);
    return normalizeSaving(response.data.data);
  }

  async createSaving(payload: SavingCreateInput): Promise<Saving> {
    const response = await httpClient.post<ApiResponse<Saving>>('/api/savings', payload);
    return normalizeSaving(response.data.data);
  }

  async updateSaving(savingId: string, payload: SavingUpdateInput): Promise<Saving> {
    const response = await httpClient.put<ApiResponse<Saving>>(`/api/savings/${savingId}`, payload);
    return normalizeSaving(response.data.data);
  }

  async deleteSaving(savingId: string): Promise<void> {
    await httpClient.delete(`/api/savings/${savingId}`);
  }
}
