import { executeSQL, fetchOne, fetchRows } from "../db/init";

/* ===================== TYPES ===================== */

export interface Budget {
  id: string;
  server_id?: number;
  user_id: string;
  category_id: string;
  amount_limit: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  notify_threshold: number; // percentage
  version: number;
  updated_at: number;
  deleted_at?: number;
  sync_status: string;
}

export interface CreateBudgetPayload {
  category_id: string;
  amount_limit: number;
  start_date: string;
  end_date: string;
  notify_threshold: number;
}

export interface UpdateBudgetPayload {
  amount_limit?: number;
  start_date?: string;
  end_date?: string;
  notify_threshold?: number;
}

/* ===================== DAO ===================== */

/**
 * Get all budgets for a user
 */
export const getBudgets = async (userId: string): Promise<Budget[]> => {
  const budgets = await fetchRows<Budget>(
    `SELECT * FROM budgets 
     WHERE user_id = ? AND deleted_at IS NULL 
     ORDER BY updated_at DESC`,
    [userId],
  );
  return budgets;
};

/**
 * Get budget by ID
 */
export const getBudgetById = async (id: string): Promise<Budget | null> => {
  return fetchOne<Budget>(
    `SELECT * FROM budgets WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
};

/**
 * Get budget for a specific category
 */
export const getBudgetByCategory = async (
  userId: string,
  categoryId: string,
): Promise<Budget | null> => {
  return fetchOne<Budget>(
    `SELECT * FROM budgets 
     WHERE user_id = ? AND category_id = ? AND deleted_at IS NULL`,
    [userId, categoryId],
  );
};

/**
 * Get active budgets for current date
 */
export const getActiveBudgets = async (userId: string): Promise<Budget[]> => {
  const today = new Date().toISOString().split("T")[0];
  const budgets = await fetchRows<Budget>(
    `SELECT * FROM budgets 
     WHERE user_id = ? AND start_date <= ? AND end_date >= ? AND deleted_at IS NULL 
     ORDER BY updated_at DESC`,
    [userId, today, today],
  );
  return budgets;
};

/**
 * Create new budget
 */
export const createBudget = async (
  userId: string,
  payload: CreateBudgetPayload,
): Promise<Budget> => {
  const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await executeSQL(
    `INSERT INTO budgets (
      id, user_id, category_id, amount_limit, start_date, end_date, 
      notify_threshold, version, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      payload.category_id,
      payload.amount_limit,
      payload.start_date,
      payload.end_date,
      payload.notify_threshold,
      1,
      now,
      "PENDING",
    ],
  );

  return {
    id,
    user_id: userId,
    category_id: payload.category_id,
    amount_limit: payload.amount_limit,
    start_date: payload.start_date,
    end_date: payload.end_date,
    notify_threshold: payload.notify_threshold,
    version: 1,
    updated_at: now,
    sync_status: "PENDING",
  };
};

/**
 * Update budget
 */
export const updateBudget = async (
  id: string,
  payload: UpdateBudgetPayload,
): Promise<Budget | null> => {
  const now = Date.now();
  const current = await getBudgetById(id);

  if (!current) {
    throw new Error("Budget not found");
  }

  const updated = {
    ...current,
    ...payload,
    updated_at: now,
    sync_status: "PENDING",
  };

  await executeSQL(
    `UPDATE budgets SET 
      amount_limit = ?, start_date = ?, end_date = ?, notify_threshold = ?,
      version = version + 1, updated_at = ?, sync_status = ?
     WHERE id = ?`,
    [
      updated.amount_limit,
      updated.start_date,
      updated.end_date,
      updated.notify_threshold,
      now,
      "PENDING",
      id,
    ],
  );

  return updated;
};

/**
 * Delete budget (soft delete)
 */
export const deleteBudget = async (id: string): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE budgets SET deleted_at = ?, sync_status = ? WHERE id = ?`,
    [now, "PENDING", id],
  );
};

/**
 * Delete all budgets for a user (soft delete)
 */
export const deleteUserBudgets = async (userId: string): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE budgets SET deleted_at = ?, sync_status = ? WHERE user_id = ? AND deleted_at IS NULL`,
    [now, "PENDING", userId],
  );
};
