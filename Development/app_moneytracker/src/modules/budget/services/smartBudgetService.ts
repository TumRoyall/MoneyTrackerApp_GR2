/**
 * Smart Budget Service
 *
 * Handles the business logic for calculating and generating Smart Budgets.
 * Smart Budget automatically creates budget allocations based on:
 * - Total assets (sum of all REGULAR wallet balances)
 * - User's saving target percentage from Onboarding
 *
 * The algorithm distributes the total asset across categories:
 * - Savings: user's saving_target_percent
 * - Other categories: pre-defined percentages that sum to (100% - savings%)
 */

import { SMART_BUDGET_CATEGORIES, getSmartBudgetCategoryKeys } from './smartBudgetCategories';

export interface SmartBudgetItem {
  key: string; // 'savings', 'food', 'home', etc.
  categoryGroupId: string; // 'savings', 'food', 'home', etc.
  categoryName: string;
  icon: string;
  color: string;
  percent: number;
  amount: number;
}

export interface SmartBudgetResult {
  totalAsset: number;
  savingTargetPercent: number;
  items: SmartBudgetItem[];
  totalPercent: number;
}

/**
 * Calculate Smart Budget allocation based on total asset and saving target.
 *
 * @param totalAsset - Total balance from all REGULAR wallets
 * @param savingTargetPercent - User's saving target from onboarding (e.g., 20 for 20%)
 * @returns SmartBudgetResult with all items and their allocations
 *
 * Algorithm:
 * 1. Calculate savings amount: totalAsset × savingTargetPercent
 * 2. Calculate remaining amount: totalAsset - savingsAmount
 * 3. Distribute remaining across categories proportionally
 *    - Other percentages are normalized so they sum to remaining
 */
export function calculateSmartBudget(
  totalAsset: number,
  savingTargetPercent: number
): SmartBudgetResult {
  // Handle edge cases
  if (totalAsset <= 0) {
    return {
      totalAsset: 0,
      savingTargetPercent,
      items: [],
      totalPercent: savingTargetPercent,
    };
  }

  const items: SmartBudgetItem[] = [];
  let totalPercent = 0;

  // Step 1: Calculate savings
  const savingsAmount = Math.round((totalAsset * savingTargetPercent) / 100);
  items.push({
    key: 'savings',
    categoryGroupId: 'savings',
    categoryName: SMART_BUDGET_CATEGORIES.savings.name,
    icon: SMART_BUDGET_CATEGORIES.savings.icon,
    color: SMART_BUDGET_CATEGORIES.savings.color,
    percent: savingTargetPercent,
    amount: savingsAmount,
  });
  totalPercent += savingTargetPercent;

  // Step 2: Needs (Chi tiêu thiết yếu) ALWAYS takes 50%.
  // Food (25%), Home (15%), Transport (10%)
  const needsKeys = ['food', 'home', 'transport'];
  needsKeys.forEach((key) => {
    const config = SMART_BUDGET_CATEGORIES[key];
    const percent = config.defaultPercent; // 25, 15, 10
    const amount = Math.round((totalAsset * percent) / 100);

    items.push({
      key,
      categoryGroupId: config.groupId,
      categoryName: config.name,
      icon: config.icon,
      color: config.color,
      percent,
      amount,
    });
    totalPercent += percent;
  });

  // Step 3: Wants (Sở thích) takes the rest: (100 - 50 - savings)
  const wantsKeys = ['entertainment', 'shopping'];
  const wantsPercent = Math.max(0, 100 - 50 - savingTargetPercent);
  
  if (wantsPercent > 0) {
    // Split evenly, round to multiple of 5 if possible, but keep integer
    const baseWantsPercent = Math.floor(wantsPercent / wantsKeys.length);
    let remainderWants = wantsPercent - (baseWantsPercent * wantsKeys.length);

    wantsKeys.forEach((key, index) => {
      const config = SMART_BUDGET_CATEGORIES[key];
      // Give remainder to the first one (e.g., if 15% / 2 -> 8% and 7%)
      let percent = baseWantsPercent;
      if (remainderWants > 0) {
        // Try to distribute to make it end in 0 or 5 if possible?
        // Let's just give remainder to the first item.
        percent += remainderWants;
        remainderWants = 0;
      }
      
      const amount = Math.round((totalAsset * percent) / 100);
      
      items.push({
        key,
        categoryGroupId: config.groupId,
        categoryName: config.name,
        icon: config.icon,
        color: config.color,
        percent,
        amount,
      });
      totalPercent += percent;
    });
  }

  // Round total percent
  totalPercent = Math.round(totalPercent * 10) / 10;

  return {
    totalAsset,
    savingTargetPercent,
    items,
    totalPercent,
  };
}

/**
 * Recalculate amounts when user adjusts a single item's percentage.
 * No auto-rebalancing anymore.
 */
export function recalculateSmartBudget(
  items: SmartBudgetItem[],
  changedKey: string,
  newPercent: number,
  totalAsset: number
): SmartBudgetResult {
  // Clamp percent to valid range
  const clampedPercent = Math.max(0, Math.min(100, newPercent));

  // Update the changed item only
  let updatedItems = items.map((item) => {
    if (item.key === changedKey) {
      return {
        ...item,
        percent: clampedPercent,
        amount: Math.round((totalAsset * clampedPercent) / 100),
      };
    }
    return item;
  });

  // Calculate new total
  const totalPercent = updatedItems.reduce((sum, item) => sum + item.percent, 0);

  return {
    totalAsset,
    savingTargetPercent: updatedItems.find((i) => i.key === 'savings')?.percent ?? 0,
    items: updatedItems,
    totalPercent: Math.round(totalPercent * 10) / 10,
  };
}

/**
 * Get the maximum possible percent for an item (leaving 0% for others).
 */
export function getMaxPercent(items: SmartBudgetItem[], targetKey: string): number {
  const otherSum = items
    .filter((i) => i.key !== targetKey)
    .reduce((sum, i) => sum + i.percent, 0);
  return Math.max(0, 100 - otherSum);
}

/**
 * Format currency for display.
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString('vi-VN');
}
