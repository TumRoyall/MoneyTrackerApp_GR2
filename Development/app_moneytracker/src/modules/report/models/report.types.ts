export interface ReportFilters {
  fromDate: string;
  toDate: string;
  walletId?: string;
  categoryId?: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface ReportByTimeItem {
  date: string;
  income: number;
  expense: number;
}

export interface ReportByCategoryItem {
  categoryId: string;
  total: number;
}

export interface ReportByWalletItem {
  walletId: string;
  total: number;
}
