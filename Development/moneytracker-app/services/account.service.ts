/**
 * Account Service - Local Database
 * Replaces backend API calls for account management
 */

import * as AccountDAO from "@/dao/AccountDAO";
import { AccountDAO as Types } from "@/dao/AccountDAO";

export type AccountType = Types.AccountType;
export type Account = Types.Account;
export type CreateAccountPayload = Types.CreateAccountPayload;

/* ===================== SERVICE FUNCTIONS ===================== */

/**
 * Get all accounts for current user
 */
export const getAccounts = async (userId: string): Promise<Account[]> => {
  try {
    console.log("[AccountService] Fetching accounts for user:", userId);
    const accounts = await AccountDAO.getAccounts(userId);
    console.log("[AccountService] Retrieved", accounts.length, "accounts");
    return accounts;
  } catch (error) {
    console.error("[AccountService] Error fetching accounts:", error);
    throw error;
  }
};

/**
 * Get single account by ID
 */
export const getAccountById = async (id: string): Promise<Account | null> => {
  try {
    console.log("[AccountService] Fetching account:", id);
    const account = await AccountDAO.getAccountById(id);
    return account;
  } catch (error) {
    console.error("[AccountService] Error fetching account:", error);
    throw error;
  }
};

/**
 * Get accounts by type
 */
export const getAccountsByType = async (
  userId: string,
  type: AccountType,
): Promise<Account[]> => {
  try {
    console.log(
      "[AccountService] Fetching",
      type,
      "accounts for user:",
      userId,
    );
    const accounts = await AccountDAO.getAccountsByType(userId, type);
    return accounts;
  } catch (error) {
    console.error("[AccountService] Error fetching accounts by type:", error);
    throw error;
  }
};

/**
 * Create new account
 */
export const createAccount = async (
  userId: string,
  payload: CreateAccountPayload,
): Promise<Account> => {
  try {
    console.log("[AccountService] Creating account:", payload.account_name);
    const account = await AccountDAO.createAccount(userId, payload);
    console.log("[AccountService] Account created with ID:", account.id);
    return account;
  } catch (error) {
    console.error("[AccountService] Error creating account:", error);
    throw error;
  }
};

/**
 * Update account
 */
export const updateAccount = async (
  id: string,
  payload: Partial<CreateAccountPayload>,
): Promise<Account> => {
  try {
    console.log("[AccountService] Updating account:", id);
    const account = await AccountDAO.updateAccount(id, payload);
    console.log("[AccountService] Account updated");
    return account;
  } catch (error) {
    console.error("[AccountService] Error updating account:", error);
    throw error;
  }
};

/**
 * Delete account
 */
export const deleteAccount = async (id: string): Promise<void> => {
  try {
    console.log("[AccountService] Deleting account:", id);
    await AccountDAO.deleteAccount(id);
    console.log("[AccountService] Account deleted");
  } catch (error) {
    console.error("[AccountService] Error deleting account:", error);
    throw error;
  }
};

/**
 * Get total balance across all accounts
 */
export const getTotalBalance = async (userId: string): Promise<number> => {
  try {
    const balance = await AccountDAO.getTotalBalance(userId);
    return balance;
  } catch (error) {
    console.error("[AccountService] Error getting total balance:", error);
    throw error;
  }
};
