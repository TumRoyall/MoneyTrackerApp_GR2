export interface Transaction {
  transactionId: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: string;
  note?: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface TransactionCreateInput {
  walletId: string;
  categoryId: string;
  amount: number;
  type: string;
  note?: string | null;
  transactionDate: string;
}

export interface TransactionUpdateInput {
  walletId?: string;
  categoryId?: string;
  amount?: number;
  type?: string;
  note?: string | null;
  transactionDate?: string;
}

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  type?: string;
  keyword?: string;
}
