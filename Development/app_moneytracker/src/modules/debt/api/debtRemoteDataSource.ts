import { Debt, DebtCreateInput, DebtUpdateInput } from '@/modules/debt/models/debt.types';

export interface DebtRemoteDataSource {
  getDebts(): Promise<Debt[]>;
  getDebt(debtId: string): Promise<Debt | null>;
  createDebt(payload: DebtCreateInput): Promise<Debt>;
  updateDebt(debtId: string, payload: DebtUpdateInput): Promise<Debt>;
  deleteDebt(debtId: string): Promise<void>;
}
