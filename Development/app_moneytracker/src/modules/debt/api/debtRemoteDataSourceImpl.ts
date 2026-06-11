import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { Debt, DebtCreateInput, DebtUpdateInput } from '@/modules/debt/models/debt.types';
import { DebtRemoteDataSource } from '@/modules/debt/api/debtRemoteDataSource';

const normalizeDebt = (item: Debt): Debt => ({
  ...item,
  targetAmount: Number(item.targetAmount ?? 0),
  currentBalance: item.currentBalance == null ? null : Number(item.currentBalance),
});

export class DebtRemoteDataSourceImpl implements DebtRemoteDataSource {
  async getDebts(): Promise<Debt[]> {
    const response = await httpClient.get<ApiResponse<Debt[]>>('/api/debts');
    return response.data.data.map(normalizeDebt);
  }

  async getDebt(debtId: string): Promise<Debt | null> {
    const response = await httpClient.get<ApiResponse<Debt>>(`/api/debts/${debtId}`);
    return normalizeDebt(response.data.data);
  }

  async createDebt(payload: DebtCreateInput): Promise<Debt> {
    const response = await httpClient.post<ApiResponse<Debt>>('/api/debts', payload);
    return normalizeDebt(response.data.data);
  }

  async updateDebt(debtId: string, payload: DebtUpdateInput): Promise<Debt> {
    const response = await httpClient.put<ApiResponse<Debt>>(`/api/debts/${debtId}`, payload);
    return normalizeDebt(response.data.data);
  }

  async deleteDebt(debtId: string): Promise<void> {
    await httpClient.delete(`/api/debts/${debtId}`);
  }
}
