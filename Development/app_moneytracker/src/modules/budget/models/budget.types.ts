export interface Budget {
  budgetId: string;
  userId: string;
  walletId?: string | null;
  categoryId?: string | null;
  amount: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface BudgetCreateInput {
  walletId?: string | null;
  categoryId?: string | null;
  amount: number;
  periodStart: string;
  periodEnd: string;
}

export interface BudgetUpdateInput {
  walletId?: string | null;
  categoryId?: string | null;
  amount?: number;
  periodStart?: string;
  periodEnd?: string;
}
