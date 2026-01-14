import api from "@/services/axios";

/* ===================== TYPES ===================== */

// SYNC CHUẨN VỚI BE ENUM
export type AccountType =
  | "REGULAR"
  | "CASH"
  | "SAVING"
  | "DEBT"
  | "INVEST"
  | "EVENT";

export interface Account {
  accountId: number;
  accountName: string;
  type: AccountType;
  currency: string;
  currentValue: number;
  createdAt: string;
}

export interface CreateAccountPayload {
  accountName: string;
  current_value: number | string;
  currency: string;
  type: AccountType; // 👈 QUAN TRỌNG
  description?: string;
}

/* ===================== API ===================== */

export const getAccounts = async (): Promise<Account[]> => {
  const res = await api.get<Account[]>("/api/accounts");
  return res.data;
};

export const createAccount = async (
  payload: CreateAccountPayload
): Promise<Account> => {
  const res = await api.post<Account>("/api/accounts", payload);
  return res.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/api/accounts/${id}`);
};
