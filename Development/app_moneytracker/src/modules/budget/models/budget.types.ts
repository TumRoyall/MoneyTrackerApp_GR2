export interface Budget {
  budgetId: string;
  userId?: string;
  walletId?: string | null;
  categoryId?: string | null;
  categoryIds?: string[];
  title?: string;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType?: 'custom' | 'monthly' | 'weekly' | 'biweekly' | 'yearly' | string;
  alertThreshold?: number | null;
  spentAmount?: number;
  remainingAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
}

export interface BudgetCreateInput {
  // walletId removed - Budget now applies to all REGULAR wallets
  categoryId?: string;
  categoryIds?: string[];
  title: string;
  amountLimit: number;
  periodStart: string;
  periodEnd: string;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  alertThreshold?: number | null;
}

export interface BudgetUpdateInput {
  // walletId removed - Budget now applies to all REGULAR wallets
  categoryId?: string;
  categoryIds?: string[];
  title?: string;
  amountLimit?: number;
  periodStart?: string;
  periodEnd?: string;
  periodType?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  alertThreshold?: number | null;
}
