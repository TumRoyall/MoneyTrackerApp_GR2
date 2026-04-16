import {
  BudgetCreateInput,
  BudgetUpdateInput,
} from '@/modules/budget/models/budget.types';
import { BudgetRemoteDataSource } from '@/modules/budget/api/budgetRemoteDataSource';
import { BudgetRepository } from '@/modules/budget/repository/budgetRepository';

export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(private readonly remote: BudgetRemoteDataSource) {}

  async getBudgets() {
    return this.remote.getBudgets();
  }

  async getBudget(budgetId: string) {
    return this.remote.getBudget(budgetId);
  }

  async createBudget(payload: BudgetCreateInput) {
    return this.remote.createBudget(payload);
  }

  async updateBudget(budgetId: string, payload: BudgetUpdateInput) {
    return this.remote.updateBudget(budgetId, payload);
  }

  async deleteBudget(budgetId: string) {
    return this.remote.deleteBudget(budgetId);
  }
}
