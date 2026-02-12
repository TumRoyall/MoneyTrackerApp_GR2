import { executeSQL, fetchOne, fetchRows } from "./init";

/* ===================== TYPES ===================== */

export type AccountType =
  | "REGULAR"
  | "CASH"
  | "SAVING"
  | "DEBT"
  | "INVEST"
  | "EVENT";

export interface Account {
  id: string;
  server_id?: number;
  user_id: string;
  type: AccountType;
  account_name: string;
  current_value: number;
  currency: string;
  description?: string;
  version: number;
  updated_at: number;
  deleted_at?: number;
  sync_status: string;
}

export interface CreateAccountPayload {
  account_name: string;
  current_value: number;
  currency: string;
  type: AccountType;
  description?: string;
}

/* ===================== DAO ===================== */

/**
 * Get all accounts for current user
 */
export const getAccounts = async (userId: string): Promise<Account[]> => {
  const accounts = await fetchRows<Account>(
    `SELECT * FROM accounts WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
    [userId],
  );
  return accounts;
};

/**
 * Get single account by ID
 */
export const getAccountById = async (id: string): Promise<Account | null> => {
  return fetchOne<Account>(
    `SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
};

/**
 * Get accounts by type
 */
export const getAccountsByType = async (
  userId: string,
  type: AccountType,
): Promise<Account[]> => {
  return fetchRows<Account>(
    `SELECT * FROM accounts WHERE user_id = ? AND type = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
    [userId, type],
  );
};

/**
 * Create new account
 */
export const createAccount = async (
  userId: string,
  payload: CreateAccountPayload,
): Promise<Account> => {
  const id = generateUUID();
  const now = Date.now();

  await executeSQL(
    `INSERT INTO accounts (
      id, user_id, type, account_name, current_value, currency, description, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      payload.type,
      payload.account_name,
      payload.current_value,
      payload.currency,
      payload.description || null,
      now,
      "PENDING",
    ],
  );

  const account = await getAccountById(id);
  if (!account) throw new Error("Failed to create account");
  return account;
};

/**
 * Update account
 */
export const updateAccount = async (
  id: string,
  payload: Partial<CreateAccountPayload>,
): Promise<Account> => {
  const now = Date.now();
  const updateFields: string[] = [];
  const values: any[] = [];

  if (payload.account_name) {
    updateFields.push("account_name = ?");
    values.push(payload.account_name);
  }
  if (payload.current_value !== undefined) {
    updateFields.push("current_value = ?");
    values.push(payload.current_value);
  }
  if (payload.currency) {
    updateFields.push("currency = ?");
    values.push(payload.currency);
  }
  if (payload.description !== undefined) {
    updateFields.push("description = ?");
    values.push(payload.description);
  }

  if (updateFields.length > 0) {
    updateFields.push("updated_at = ?");
    values.push(now);
    updateFields.push("sync_status = ?");
    values.push("PENDING");
    values.push(id);

    await executeSQL(
      `UPDATE accounts SET ${updateFields.join(", ")} WHERE id = ?`,
      values,
    );
  }

  const account = await getAccountById(id);
  if (!account) throw new Error("Failed to update account");
  return account;
};

/**
 * Delete account (soft delete)
 */
export const deleteAccount = async (id: string): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE accounts SET deleted_at = ?, sync_status = ? WHERE id = ?`,
    [now, "PENDING", id],
  );
};

/**
 * Get total balance across all accounts
 */
export const getTotalBalance = async (userId: string): Promise<number> => {
  const result = await fetchOne<{ total: number }>(
    `SELECT SUM(current_value) as total FROM accounts WHERE user_id = ? AND deleted_at IS NULL`,
    [userId],
  );
  return result?.total || 0;
};

/**
 * Get account by server_id (for syncing)
 */
export const getAccountByServerId = async (
  serverId: number,
): Promise<Account | null> => {
  return fetchOne<Account>(
    `SELECT * FROM accounts WHERE server_id = ? AND deleted_at IS NULL`,
    [serverId],
  );
};

/**
 * Update account with server_id after sync
 */
export const updateAccountWithServerId = async (
  id: string,
  serverId: number,
): Promise<void> => {
  await executeSQL(
    `UPDATE accounts SET server_id = ?, sync_status = ? WHERE id = ?`,
    [serverId, "SYNCED", id],
  );
};

/**
 * Helper to generate UUID
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
