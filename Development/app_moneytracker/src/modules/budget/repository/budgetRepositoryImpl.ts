import {
  BudgetCreateInput,
  BudgetUpdateInput,
} from '@/modules/budget/models/budget.types';
import { BudgetRemoteDataSource } from '@/modules/budget/api/budgetRemoteDataSource';
import { BudgetRepository } from '@/modules/budget/repository/budgetRepository';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(private readonly remote: BudgetRemoteDataSource) {}

  async getBudgets() {
    return this.remote.getBudgets();
  }

  async getBudget(budgetId: string) {
    return this.remote.getBudget(budgetId);
  }

  async createBudget(payload: BudgetCreateInput) {
    try { await syncService.syncOnce(); } catch (e) { console.error('Budget sync error', e); }
    return this.remote.createBudget(payload);
  }

  async updateBudget(budgetId: string, payload: BudgetUpdateInput) {
    try { await syncService.syncOnce(); } catch (e) { console.error('Budget sync error', e); }
    return this.remote.updateBudget(budgetId, payload);
  }

  async deleteBudget(budgetId: string) {
    return this.remote.deleteBudget(budgetId);
  }
}
