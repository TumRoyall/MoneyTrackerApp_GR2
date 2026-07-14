/**
 * Smart Budget UseCases
 *
 * Business logic for Smart Budget feature.
 * Connects Wallet, Onboarding, and Budget data.
 */

import { router } from 'expo-router';

import { onboardingStorage } from '@/modules/onboarding/storage/onboardingStorage';
import { createWalletUsecases } from '@/modules/wallet/usecases/walletUsecases';
import { WalletRemoteDataSourceImpl } from '@/modules/wallet/api/walletRemoteDataSourceImpl';
import { WalletRepositoryImpl } from '@/modules/wallet/repository/walletRepositoryImpl';
import { createCategoryUsecases } from '@/modules/category/usecases/categoryUsecases';
import { CategoryRemoteDataSourceImpl } from '@/modules/category/api/categoryRemoteDataSourceImpl';
import { CategoryRepositoryLocalFirst } from '@/modules/category/repository/categoryRepositoryLocalFirst';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { createBudgetUsecases } from '@/modules/budget/usecases/budgetUsecases';
import { BudgetRemoteDataSourceImpl } from '@/modules/budget/api/budgetRemoteDataSourceImpl';
import { BudgetRepositoryImpl } from '@/modules/budget/repository/budgetRepositoryImpl';
import { BudgetCreateInput } from '@/modules/budget/models/budget.types';
import { calculateSmartBudget, SmartBudgetResult } from '@/modules/budget/services/smartBudgetService';
import { getCurrentMonthPeriod } from '@/modules/budget/utils/periodUtils';
import { syncService } from '@/modules/sync/service/syncServiceSingleton';

// Create singleton instances for repositories
const walletRepository = new WalletRepositoryImpl(new WalletRemoteDataSourceImpl());
const categoryRepository = new CategoryRepositoryLocalFirst(
  new CategoryLocalDataSource(),
  new CategoryRemoteDataSourceImpl(),
  syncService,
);
const budgetRepository = new BudgetRepositoryImpl(new BudgetRemoteDataSourceImpl());

/**
 * Get total balance from all REGULAR wallets.
 * Excludes SAVING, DEBT, EVENT wallet types.
 */
export async function getTotalRegularBalance(): Promise<number> {
  const walletUsecases = createWalletUsecases(walletRepository);
  const wallets = await walletUsecases.getWallets();

  return wallets
    .filter((wallet) => wallet.type === 'REGULAR' && !wallet.deletedAt)
    .reduce((sum, wallet) => sum + wallet.currentBalance, 0);
}

/**
 * Check if user has completed onboarding.
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  return onboardingStorage.isCompleted();
}

/**
 * Get onboarding data including saving target percent.
 */
export async function getOnboardingData() {
  return onboardingStorage.getData();
}

/**
 * Navigate to onboarding if not completed.
 * Returns true if navigated, false if already completed.
 */
export async function redirectToOnboardingIfNeeded(): Promise<boolean> {
  const completed = await isOnboardingCompleted();
  if (!completed) {
    router.push('/onboarding');
    return true;
  }
  return false;
}

/**
 * Generate Smart Budget result based on user's data.
 * This is the main entry point for generating a smart budget preview.
 */
export async function generateSmartBudget(): Promise<SmartBudgetResult> {
  // Get data in parallel for performance
  const [onboardingData, totalAsset] = await Promise.all([
    onboardingStorage.getData(),
    getTotalRegularBalance(),
  ]);

  // Calculate smart budget using the service
  return calculateSmartBudget(totalAsset, onboardingData.savingTargetPercent);
}

/**
 * Create actual budgets from Smart Budget items.
 * This is called when user confirms the Smart Budget preview.
 *
 * @param items - The Smart Budget items to create budgets for
 * @returns Array of created Budget IDs
 */
export async function createBudgetsFromSmartBudget(
  items: SmartBudgetResult['items']
): Promise<string[]> {
  // Get all categories
  const categoryUsecases = createCategoryUsecases(categoryRepository);
  const categories = await categoryUsecases.getCategories();

  // Create a map for quick lookup by groupId
  // Categories have a groupId property based on their icon group
  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => {
    // The groupId is derived from the category's icon configuration
    // For default categories, we need to match by name or icon
    if (cat.groupId) {
      categoryMap.set(cat.groupId, cat.categoryId);
    }
  });

  // Get current month period
  const { periodStart, periodEnd } = getCurrentMonthPeriod();

  // Create budget inputs
  const budgetInputs: BudgetCreateInput[] = items.map((item) => {
    // Find the category by groupId
    // Note: We use categoryGroupId to match with category's groupId
    const categoryId = categoryMap.get(item.categoryGroupId);

    return {
      // walletId intentionally omitted - budget applies to all wallets
      categoryIds: categoryId ? [categoryId] : [],
      title: item.categoryName,
      amountLimit: item.amount,
      periodStart,
      periodEnd,
      periodType: 'monthly',
      alertThreshold: 80, // Default alert at 80% spent
    };
  });

  // Create all budgets
  const budgetUsecases = createBudgetUsecases(budgetRepository);
  const createdBudgets = await Promise.all(
    budgetInputs.map((input) => budgetUsecases.createBudget(input))
  );

  return createdBudgets.map((budget) => budget.budgetId);
}

/**
 * Smart Budget UseCase hook for React components.
 * Provides easy access to Smart Budget functionality.
 */
export const useSmartBudgetUsecases = () => {
  return {
    /**
     * Check if onboarding is completed.
     */
    checkOnboarding: isOnboardingCompleted,

    /**
     * Get total regular balance.
     */
    getTotalBalance: getTotalRegularBalance,

    /**
     * Generate Smart Budget preview.
     */
    generate: generateSmartBudget,

    /**
     * Redirect to onboarding if needed.
     */
    redirectToOnboarding: redirectToOnboardingIfNeeded,

    /**
     * Create budgets from Smart Budget items.
     */
    createBudgets: createBudgetsFromSmartBudget,
  };
};
