import { executeSQL, fetchOne, fetchRows } from "@/db/init";

/* ===================== TYPES ===================== */

export interface Transaction {
  transaction_id: string;
  server_id?: number;
  account_id: string;
  created_by: string;
  category_id: string;
  amount: number;
  note?: string;
  tx_date: string; // YYYY-MM-DD
  version: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  sync_status: string;
}

export interface CreateTransactionPayload {
  account_id: string;
  category_id: string;
  amount: number;
  note?: string;
  tx_date: string; // YYYY-MM-DD
}

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
}

/* ===================== DAO ===================== */

/**
 * Get all transactions for an account
 */
export const getTransactions = async (
  accountId: string,
  filter?: TransactionFilter,
): Promise<Transaction[]> => {
  let sql = `SELECT * FROM transactions WHERE account_id = ? AND deleted_at IS NULL`;
  const params: any[] = [accountId];

  if (filter?.categoryId) {
    sql += ` AND category_id = ?`;
    params.push(filter.categoryId);
  }

  if (filter?.fromDate) {
    sql += ` AND tx_date >= ?`;
    params.push(filter.fromDate);
  }

  if (filter?.toDate) {
    sql += ` AND tx_date <= ?`;
    params.push(filter.toDate);
  }

  if (filter?.minAmount !== undefined) {
    sql += ` AND amount >= ?`;
    params.push(filter.minAmount);
  }

  if (filter?.maxAmount !== undefined) {
    sql += ` AND amount <= ?`;
    params.push(filter.maxAmount);
  }

  sql += ` ORDER BY tx_date DESC, updated_at DESC`;

  return fetchRows<Transaction>(sql, params);
};

/**
 * Get transactions across all accounts for a user
 */
export const getTransactionsByUser = async (
  userId: string,
  filter?: TransactionFilter,
): Promise<Transaction[]> => {
  let sql = `
    SELECT t.* FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    WHERE a.user_id = ? AND t.deleted_at IS NULL
  `;
  const params: any[] = [userId];

  if (filter?.accountId) {
    sql += ` AND t.account_id = ?`;
    params.push(filter.accountId);
  }

  if (filter?.categoryId) {
    sql += ` AND t.category_id = ?`;
    params.push(filter.categoryId);
  }

  if (filter?.fromDate) {
    sql += ` AND t.tx_date >= ?`;
    params.push(filter.fromDate);
  }

  if (filter?.toDate) {
    sql += ` AND t.tx_date <= ?`;
    params.push(filter.toDate);
  }

  if (filter?.minAmount !== undefined) {
    sql += ` AND t.amount >= ?`;
    params.push(filter.minAmount);
  }

  if (filter?.maxAmount !== undefined) {
    sql += ` AND t.amount <= ?`;
    params.push(filter.maxAmount);
  }

  sql += ` ORDER BY t.tx_date DESC, t.updated_at DESC`;

  return fetchRows<Transaction>(sql, params);
};

/**
 * Get single transaction by ID
 */
export const getTransactionById = async (
  transactionId: string,
): Promise<Transaction | null> => {
  return fetchOne<Transaction>(
    `SELECT * FROM transactions WHERE transaction_id = ? AND deleted_at IS NULL`,
    [transactionId],
  );
};

/**
 * Create new transaction
 */
export const createTransaction = async (
  userId: string,
  payload: CreateTransactionPayload,
): Promise<Transaction> => {
  const transactionId = generateUUID();
  const now = Date.now();

  await executeSQL(
    `INSERT INTO transactions (
      transaction_id, account_id, created_by, category_id, amount, note, tx_date, created_at, updated_at, version, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      payload.account_id,
      userId,
      payload.category_id,
      payload.amount,
      payload.note || null,
      payload.tx_date,
      now,
      now,
      1,
      "PENDING",
    ],
  );

  const transaction = await getTransactionById(transactionId);
  if (!transaction) throw new Error("Failed to create transaction");
  return transaction;
};

/**
 * Update transaction
 */
export const updateTransaction = async (
  transactionId: string,
  payload: Partial<CreateTransactionPayload>,
): Promise<Transaction> => {
  const now = Date.now();
  const updateFields: string[] = [];
  const values: any[] = [];

  if (payload.category_id) {
    updateFields.push("category_id = ?");
    values.push(payload.category_id);
  }
  if (payload.amount !== undefined) {
    updateFields.push("amount = ?");
    values.push(payload.amount);
  }
  if (payload.note !== undefined) {
    updateFields.push("note = ?");
    values.push(payload.note);
  }
  if (payload.tx_date) {
    updateFields.push("tx_date = ?");
    values.push(payload.tx_date);
  }

  if (updateFields.length > 0) {
    updateFields.push("updated_at = ?");
    values.push(now);
    updateFields.push("sync_status = ?");
    values.push("PENDING");
    values.push(transactionId);

    await executeSQL(
      `UPDATE transactions SET ${updateFields.join(", ")} WHERE transaction_id = ?`,
      values,
    );
  }

  const transaction = await getTransactionById(transactionId);
  if (!transaction) throw new Error("Failed to update transaction");
  return transaction;
};

/**
 * Delete transaction (soft delete)
 */
export const deleteTransaction = async (
  transactionId: string,
): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE transactions SET deleted_at = ?, sync_status = ? WHERE transaction_id = ?`,
    [now, "PENDING", transactionId],
  );
};

/**
 * Get transaction summary for account within date range
 */
export const getTransactionSummary = async (
  accountId: string,
  fromDate: string,
  toDate: string,
): Promise<{ total_expense: number; total_income: number; count: number }> => {
  const result = await fetchOne<{
    total_expense: number;
    total_income: number;
    count: number;
  }>(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN c.type = 'INCOME' THEN t.amount ELSE 0 END), 0) as total_income,
      COUNT(*) as count
    FROM transactions t
    JOIN categories c ON t.category_id = c.category_id
    WHERE t.account_id = ? AND t.tx_date >= ? AND t.tx_date <= ? AND t.deleted_at IS NULL
    `,
    [accountId, fromDate, toDate],
  );

  return result || { total_expense: 0, total_income: 0, count: 0 };
};

/**
 * Get transactions by date range grouped by date
 */
export const getTransactionsByDateRange = async (
  accountId: string,
  fromDate: string,
  toDate: string,
): Promise<{ date: string; transactions: Transaction[] }[]> => {
  const transactions = await fetchRows<Transaction>(
    `
    SELECT * FROM transactions 
    WHERE account_id = ? AND tx_date >= ? AND tx_date <= ? AND deleted_at IS NULL
    ORDER BY tx_date DESC
    `,
    [accountId, fromDate, toDate],
  );

  // Group by date
  const grouped: { [key: string]: Transaction[] } = {};
  transactions.forEach((tx) => {
    if (!grouped[tx.tx_date]) {
      grouped[tx.tx_date] = [];
    }
    grouped[tx.tx_date].push(tx);
  });

  return Object.entries(grouped)
    .map(([date, txs]) => ({ date, transactions: txs }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Get transaction by server_id (for syncing)
 */
export const getTransactionByServerId = async (
  serverId: number,
): Promise<Transaction | null> => {
  return fetchOne<Transaction>(
    `SELECT * FROM transactions WHERE server_id = ? AND deleted_at IS NULL`,
    [serverId],
  );
};

/**
 * Update transaction with server_id after sync
 */
export const updateTransactionWithServerId = async (
  transactionId: string,
  serverId: number,
): Promise<void> => {
  await executeSQL(
    `UPDATE transactions SET server_id = ?, sync_status = ? WHERE transaction_id = ?`,
    [serverId, "SYNCED", transactionId],
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
