export interface Debt {
  debtId: string;
  walletId: string;
  walletName?: string | null;
  currency?: string | null;
  currentBalance?: number | null;
  title: string;
  targetAmount: number;
  startDate?: string | null;
  targetDate?: string | null;
  paymentType?: string | null;
  periodUnit?: string | null;
  interestRate?: number | null;
  interestType?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DebtCreateInput {
  title: string;
  targetAmount: number;
  currency: string;
  startDate?: string;
  targetDate?: string;
  paymentType?: string;
  periodUnit?: string;
  interestRate?: number;
  interestType?: string;
}

export interface DebtUpdateInput {
  title?: string;
  targetAmount?: number;
  startDate?: string;
  targetDate?: string;
  paymentType?: string;
  periodUnit?: string;
  interestRate?: number;
  interestType?: string;
}
