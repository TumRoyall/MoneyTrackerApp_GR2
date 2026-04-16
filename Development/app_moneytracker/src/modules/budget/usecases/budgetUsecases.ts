import {
  BudgetCreateInput,
  BudgetUpdateInput,
} from '@/modules/budget/models/budget.types';
import { BudgetRepository } from '@/modules/budget/repository/budgetRepository';

export const createBudgetUsecases = (repository: BudgetRepository) => ({
  getBudgets: () => repository.getBudgets(),
  getBudget: (budgetId: string) => repository.getBudget(budgetId),
  createBudget: (payload: BudgetCreateInput) => repository.createBudget(payload),
  updateBudget: (budgetId: string, payload: BudgetUpdateInput) =>
    repository.updateBudget(budgetId, payload),
  deleteBudget: (budgetId: string) => repository.deleteBudget(budgetId),
});
