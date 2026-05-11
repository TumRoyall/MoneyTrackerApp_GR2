import { Saving, SavingCreateInput, SavingUpdateInput } from '@/modules/saving/models/saving.types';

export interface SavingRemoteDataSource {
  getSavings(): Promise<Saving[]>;
  getSaving(savingId: string): Promise<Saving | null>;
  createSaving(payload: SavingCreateInput): Promise<Saving>;
  updateSaving(savingId: string, payload: SavingUpdateInput): Promise<Saving>;
  deleteSaving(savingId: string): Promise<void>;
}
