import { DebtCreateInput, DebtUpdateInput } from '@/modules/debt/models/debt.types';
import { DebtRepository } from '@/modules/debt/repository/debtRepository';

export const createDebtUsecases = (repository: DebtRepository) => ({
  getDebts: () => repository.getDebts(),
  getDebt: (debtId: string) => repository.getDebt(debtId),
  createDebt: (payload: DebtCreateInput) => repository.createDebt(payload),
  updateDebt: (debtId: string, payload: DebtUpdateInput) => repository.updateDebt(debtId, payload),
  deleteDebt: (debtId: string) => repository.deleteDebt(debtId),
});
