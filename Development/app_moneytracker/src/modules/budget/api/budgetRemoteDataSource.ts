import { Budget, BudgetCreateInput, BudgetUpdateInput } from '@/modules/budget/models/budget.types';

export interface BudgetRemoteDataSource {
  getBudgets(): Promise<Budget[]>;
  getBudget(budgetId: string): Promise<Budget | null>;
  createBudget(payload: BudgetCreateInput): Promise<Budget>;
  updateBudget(budgetId: string, payload: BudgetUpdateInput): Promise<Budget>;
  deleteBudget(budgetId: string): Promise<void>;
}
