export interface Budget {
  budgetId: string;
  userId?: string;
  walletId?: string | null;
  categoryId?: string | null;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType?: 'custom' | 'monthly' | string;
  alertThreshold?: number | null;
  spentAmount?: number;
  remainingAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
}

export interface BudgetCreateInput {
  walletId: string;
  categoryId: string;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType: 'custom' | 'monthly';
  alertThreshold?: number | null;
}

export interface BudgetUpdateInput {
  walletId?: string;
  categoryId?: string;
  amountLimit?: number;
  periodStart?: string;
  periodEnd?: string;
  periodType?: 'custom' | 'monthly';
  alertThreshold?: number | null;
}
