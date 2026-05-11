import {
  SavingCreateInput,
  SavingUpdateInput,
} from '@/modules/saving/models/saving.types';
import { SavingRepository } from '@/modules/saving/repository/savingRepository';

export const createSavingUsecases = (repository: SavingRepository) => ({
  getSavings: () => repository.getSavings(),
  getSaving: (savingId: string) => repository.getSaving(savingId),
  createSaving: (payload: SavingCreateInput) => repository.createSaving(payload),
  updateSaving: (savingId: string, payload: SavingUpdateInput) =>
    repository.updateSaving(savingId, payload),
  deleteSaving: (savingId: string) => repository.deleteSaving(savingId),
});
