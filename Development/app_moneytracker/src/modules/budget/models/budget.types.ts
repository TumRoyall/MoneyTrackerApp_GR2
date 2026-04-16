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
  categoryId: string;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType: 'custom' | 'monthly';
  alertThreshold?: number | null;
}

export interface BudgetUpdateInput {
  categoryId?: string;
  amountLimit?: number;
  periodStart?: string;
  periodEnd?: string;
  periodType?: 'custom' | 'monthly';
  alertThreshold?: number | null;
}
