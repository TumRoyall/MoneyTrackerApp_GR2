import { DebtCreateInput, DebtUpdateInput } from '@/modules/debt/models/debt.types';
import { DebtRemoteDataSource } from '@/modules/debt/api/debtRemoteDataSource';
import { DebtRepository } from '@/modules/debt/repository/debtRepository';

export class DebtRepositoryImpl implements DebtRepository {
  constructor(private readonly remote: DebtRemoteDataSource) {}

  async getDebts() {
    return this.remote.getDebts();
  }

  async getDebt(debtId: string) {
    return this.remote.getDebt(debtId);
  }

  async createDebt(payload: DebtCreateInput) {
    return this.remote.createDebt(payload);
  }

  async updateDebt(debtId: string, payload: DebtUpdateInput) {
    return this.remote.updateDebt(debtId, payload);
  }

  async deleteDebt(debtId: string) {
    return this.remote.deleteDebt(debtId);
  }
}
