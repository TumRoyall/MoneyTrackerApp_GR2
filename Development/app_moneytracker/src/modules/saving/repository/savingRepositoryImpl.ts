import {
  SavingCreateInput,
  SavingUpdateInput,
} from '@/modules/saving/models/saving.types';
import { SavingRemoteDataSource } from '@/modules/saving/api/savingRemoteDataSource';
import { SavingRepository } from '@/modules/saving/repository/savingRepository';

export class SavingRepositoryImpl implements SavingRepository {
  constructor(private readonly remote: SavingRemoteDataSource) {}

  async getSavings() {
    return this.remote.getSavings();
  }

  async getSaving(savingId: string) {
    return this.remote.getSaving(savingId);
  }

  async createSaving(payload: SavingCreateInput) {
    return this.remote.createSaving(payload);
  }

  async updateSaving(savingId: string, payload: SavingUpdateInput) {
    return this.remote.updateSaving(savingId, payload);
  }

  async deleteSaving(savingId: string) {
    return this.remote.deleteSaving(savingId);
  }
}
