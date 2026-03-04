import {
    CreateBudgetPayload,
    createBudget as createDBBudget,
    Budget as DBBudget,
    deleteBudget as deleteDBBudget,
    getActiveBudgets as getDBActiveBudgets,
    getBudgetByCategory as getDBBudgetByCategory,
    getBudgets as getDBBudgets,
    UpdateBudgetPayload,
    updateBudget as updateDBBudget,
} from "@/dao/BudgetDAO";

export interface Budget {
  budgetId?: number;
  id?: string;
  userId?: string;
  user_id?: string;
  categoryId?: number;
  category_id?: string;
  amountLimit?: number;
  amount_limit?: number;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  notifyThreshold?: number;
  notify_threshold?: number;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: number;
}

export interface CreateBudgetRequest {
  categoryId: number | string;
  amountLimit: number;
  startDate: string;
  endDate: string;
  notifyThreshold: number;
}

export interface UpdateBudgetRequest {
  amountLimit?: number;
  startDate?: string;
  endDate?: string;
  notifyThreshold?: number;
}

/**
 * Get all budgets of current user from local database
 */
export async function getBudgets(userId: string): Promise<Budget[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const budgets = await getDBBudgets(userId);
  return budgets.map(normalizeBudget);
}

/**
 * Get active budgets for current user (within date range)
 */
export async function getActiveBudgets(userId: string): Promise<Budget[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const budgets = await getDBActiveBudgets(userId);
  return budgets.map(normalizeBudget);
}

/**
 * Get budget by category
 */
export async function getBudgetByCategory(
  categoryId: number | string,
  userId: string,
): Promise<Budget | null> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const categoryIdStr = String(categoryId);
  const budget = await getDBBudgetByCategory(userId, categoryIdStr);
  return budget ? normalizeBudget(budget) : null;
}

/**
 * Create new budget
 */
export async function createBudget(
  data: CreateBudgetRequest,
  userId: string,
): Promise<Budget> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const payload: CreateBudgetPayload = {
    category_id: String(data.categoryId),
    amount_limit: data.amountLimit,
    start_date: data.startDate,
    end_date: data.endDate,
    notify_threshold: data.notifyThreshold,
  };

  const budget = await createDBBudget(userId, payload);
  return normalizeBudget(budget);
}

/**
 * Update budget
 */
export async function updateBudget(
  id: string,
  data: UpdateBudgetRequest,
): Promise<Budget | null> {
  const payload: UpdateBudgetPayload = {
    amount_limit: data.amountLimit,
    start_date: data.startDate,
    end_date: data.endDate,
    notify_threshold: data.notifyThreshold,
  };

  const budget = await updateDBBudget(id, payload);
  return budget ? normalizeBudget(budget) : null;
}

/**
 * Delete budget
 */
export async function deleteBudget(id: string): Promise<void> {
  await deleteDBBudget(id);
}

/**
 * Normalize database budget format to API format
 */
function normalizeBudget(dbBudget: DBBudget): Budget {
  return {
    id: dbBudget.budget_id,
    budgetId: parseInt(dbBudget.budget_id.split("_")[1]) || undefined,
    userId: dbBudget.user_id,
    user_id: dbBudget.user_id,
    categoryId: parseInt(dbBudget.category_id),
    category_id: dbBudget.category_id,
    amountLimit: dbBudget.amount_limit,
    amount_limit: dbBudget.amount_limit,
    startDate: dbBudget.start_date,
    start_date: dbBudget.start_date,
    endDate: dbBudget.end_date,
    end_date: dbBudget.end_date,
    notifyThreshold: dbBudget.notify_threshold,
    notify_threshold: dbBudget.notify_threshold,
    updatedAt: new Date(dbBudget.updated_at).toISOString(),
    updated_at: dbBudget.updated_at,
  };
}
