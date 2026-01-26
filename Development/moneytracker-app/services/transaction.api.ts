import api from "./axios";

// ===== Types =====
export interface TransactionFilterRequest {
  accountId?: number;
  categoryId?: number;
  type?: "INCOME" | "EXPENSE";
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
}

export interface Transaction {
  transactionId: number;
  accountId: number;
  categoryId: number;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface PageableInfo {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface TransactionListResponse {
  content: Transaction[];
  pageable: PageableInfo;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface CreateTransactionRequest {
  accountId: number;
  categoryId: number;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
}

export interface UpdateTransactionRequest {
  categoryId: number;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
}

// ===== API Functions =====

/**
 * GET /api/transactions
 * Lấy danh sách transactions với filter và pagination
 */
export async function getTransactions(
  filters?: TransactionFilterRequest,
): Promise<TransactionListResponse> {
  const response = await api.get<TransactionListResponse>("/api/transactions", {
    params: filters,
  });
  return response.data;
}

/**
 * POST /api/transactions
 * Tạo transaction mới
 */
export async function createTransaction(
  data: CreateTransactionRequest,
): Promise<Transaction> {
  const response = await api.post<Transaction>("/api/transactions", data);
  return response.data;
}

/**
 * PUT /api/transactions/:txn_id
 * Cập nhật transaction
 */
export async function updateTransaction(
  transactionId: number,
  data: UpdateTransactionRequest,
): Promise<Transaction> {
  const response = await api.put<Transaction>(
    `/api/transactions/${transactionId}`,
    data,
  );
  return response.data;
}

/**
 * DELETE /api/transactions/:txn_id
 * Xóa transaction
 */
export async function deleteTransaction(transactionId: number): Promise<void> {
  await api.delete(`/api/transactions/${transactionId}`);
}
