import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import {
  Budget,
  BudgetCreateInput,
  BudgetUpdateInput,
} from '@/modules/budget/models/budget.types';
import { BudgetRemoteDataSource } from '@/modules/budget/api/budgetRemoteDataSource';

const normalizeBudget = (item: Budget): Budget => ({
  ...item,
  amountLimit: Number(item.amountLimit ?? 0),
  alertThreshold: item.alertThreshold == null ? null : Number(item.alertThreshold),
  spentAmount: item.spentAmount == null ? undefined : Number(item.spentAmount),
  remainingAmount: item.remainingAmount == null ? undefined : Number(item.remainingAmount),
});

export class BudgetRemoteDataSourceImpl implements BudgetRemoteDataSource {
  async getBudgets(): Promise<Budget[]> {
    const response = await httpClient.get<ApiResponse<Budget[] | { content?: Budget[] }>>('/api/budgets');
    const data = response.data.data;
    const budgets = Array.isArray(data) ? data : data.content ?? [];
    return budgets.map(normalizeBudget);
  }

  async getBudget(budgetId: string): Promise<Budget | null> {
    const response = await httpClient.get<ApiResponse<Budget>>(`/api/budgets/${budgetId}`);
    return normalizeBudget(response.data.data);
  }

  async createBudget(payload: BudgetCreateInput): Promise<Budget> {
    const response = await httpClient.post<ApiResponse<Budget>>('/api/budgets', payload);
    return normalizeBudget(response.data.data);
  }

  async updateBudget(budgetId: string, payload: BudgetUpdateInput): Promise<Budget> {
    const response = await httpClient.put<ApiResponse<Budget>>(`/api/budgets/${budgetId}`, payload);
    return normalizeBudget(response.data.data);
  }

  async deleteBudget(budgetId: string): Promise<void> {
    await httpClient.delete(`/api/budgets/${budgetId}`);
  }
}
