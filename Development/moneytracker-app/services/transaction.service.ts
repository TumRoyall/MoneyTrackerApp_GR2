/**
 * Transaction Service - Local Database
 * Replaces backend API calls for transaction management
 */

import * as TransactionDAO from "@/dao/TransactionDAO";
import { TransactionDAO as Types } from "@/dao/TransactionDAO";

export type Transaction = Types.Transaction;
export type CreateTransactionPayload = Types.CreateTransactionPayload;
export type TransactionFilter = Types.TransactionFilter;

/* ===================== SERVICE FUNCTIONS ===================== */

/**
 * Get transactions for an account with optional filters
 */
export const getTransactions = async (
  accountId: string,
  filter?: TransactionFilter,
): Promise<Transaction[]> => {
  try {
    console.log(
      "[TransactionService] Fetching transactions for account:",
      accountId,
    );
    const transactions = await TransactionDAO.getTransactions(
      accountId,
      filter,
    );
    console.log(
      "[TransactionService] Retrieved",
      transactions.length,
      "transactions",
    );
    return transactions;
  } catch (error) {
    console.error("[TransactionService] Error fetching transactions:", error);
    throw error;
  }
};

/**
 * Get transactions across all accounts for a user
 */
export const getTransactionsByUser = async (
  userId: string,
  filter?: TransactionFilter,
): Promise<Transaction[]> => {
  try {
    console.log("[TransactionService] Fetching transactions for user:", userId);
    const transactions = await TransactionDAO.getTransactionsByUser(
      userId,
      filter,
    );
    console.log(
      "[TransactionService] Retrieved",
      transactions.length,
      "transactions",
    );
    return transactions;
  } catch (error) {
    console.error(
      "[TransactionService] Error fetching user transactions:",
      error,
    );
    throw error;
  }
};

/**
 * Get single transaction by ID
 */
export const getTransactionById = async (
  id: string,
): Promise<Transaction | null> => {
  try {
    const transaction = await TransactionDAO.getTransactionById(id);
    return transaction;
  } catch (error) {
    console.error("[TransactionService] Error fetching transaction:", error);
    throw error;
  }
};

/**
 * Create new transaction
 */
export const createTransaction = async (
  userId: string,
  payload: CreateTransactionPayload,
): Promise<Transaction> => {
  try {
    console.log(
      "[TransactionService] Creating transaction for amount:",
      payload.amount,
    );
    const transaction = await TransactionDAO.createTransaction(userId, payload);
    console.log(
      "[TransactionService] Transaction created with ID:",
      transaction.id,
    );
    return transaction;
  } catch (error) {
    console.error("[TransactionService] Error creating transaction:", error);
    throw error;
  }
};

/**
 * Update transaction
 */
export const updateTransaction = async (
  id: string,
  payload: Partial<CreateTransactionPayload>,
): Promise<Transaction> => {
  try {
    console.log("[TransactionService] Updating transaction:", id);
    const transaction = await TransactionDAO.updateTransaction(id, payload);
    console.log("[TransactionService] Transaction updated");
    return transaction;
  } catch (error) {
    console.error("[TransactionService] Error updating transaction:", error);
    throw error;
  }
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    console.log("[TransactionService] Deleting transaction:", id);
    await TransactionDAO.deleteTransaction(id);
    console.log("[TransactionService] Transaction deleted");
  } catch (error) {
    console.error("[TransactionService] Error deleting transaction:", error);
    throw error;
  }
};

/**
 * Get transaction summary for account
 */
export const getTransactionSummary = async (
  accountId: string,
  fromDate: string,
  toDate: string,
): Promise<{ total_expense: number; total_income: number; count: number }> => {
  try {
    const summary = await TransactionDAO.getTransactionSummary(
      accountId,
      fromDate,
      toDate,
    );
    return summary;
  } catch (error) {
    console.error(
      "[TransactionService] Error getting transaction summary:",
      error,
    );
    throw error;
  }
};

/**
 * Get transactions grouped by date
 */
export const getTransactionsByDateRange = async (
  accountId: string,
  fromDate: string,
  toDate: string,
): Promise<{ date: string; transactions: Transaction[] }[]> => {
  try {
    console.log(
      "[TransactionService] Fetching transactions for date range:",
      fromDate,
      "-",
      toDate,
    );
    const grouped = await TransactionDAO.getTransactionsByDateRange(
      accountId,
      fromDate,
      toDate,
    );
    return grouped;
  } catch (error) {
    console.error(
      "[TransactionService] Error fetching transactions by date range:",
      error,
    );
    throw error;
  }
};
