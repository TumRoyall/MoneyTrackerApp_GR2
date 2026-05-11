export type SavingType = 'one_time' | 'periodic';

export type SavingPeriodUnit = 'monthly' | 'yearly';

export interface Saving {
  savingId: string;
  walletId: string;
  walletName?: string | null;
  currency?: string | null;
  currentBalance?: number | null;
  title: string;
  targetAmount: number;
  type: SavingType | string;
  periodUnit?: SavingPeriodUnit | string | null;
  startPeriod?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavingCreateInput {
  title: string;
  targetAmount: number;
  currency: string;
  type: SavingType;
  periodUnit?: SavingPeriodUnit;
  startPeriod?: string;
}

export interface SavingUpdateInput {
  title?: string;
  targetAmount?: number;
  type?: SavingType;
  periodUnit?: SavingPeriodUnit;
  startPeriod?: string;
}
