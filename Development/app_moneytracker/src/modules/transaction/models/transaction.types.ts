export interface Transaction {
  transactionId: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type?: 'INCOME' | 'EXPENSE' | string;
  note?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version?: number | null;
}

export interface TransactionCreateInput {
  walletId: string;
  categoryId: string;
  amount: number;
  type?: 'INCOME' | 'EXPENSE';
  note?: string | null;
  date: string;
}

export interface TransactionUpdateInput {
  categoryId?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  note?: string | null;
  date?: string;
}

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  type?: 'INCOME' | 'EXPENSE';
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
