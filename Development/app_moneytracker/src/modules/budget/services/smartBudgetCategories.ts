/**
 * Smart Budget Category Configuration
 *
 * Maps category group IDs from categoryIconGroups.ts to Smart Budget items.
 * These are the default expense categories for Smart Budget.
 */

export interface SmartBudgetCategoryConfig {
  groupId: string;
  name: string;
  icon: string;
  color: string;
  defaultPercent: number;
}

/**
 * Default Smart Budget categories with allocation ratios.
 *
 * Total = 100% when combined with savings
 * - Savings: user defined (from onboarding saving_target_percent)
 * - Other categories: fixed allocation based on common spending patterns
 */
export const SMART_BUDGET_CATEGORIES: Record<string, SmartBudgetCategoryConfig> = {
  savings: {
    groupId: 'savings',
    name: 'Tiết kiệm',
    icon: '🐖',
    color: '#F59E0B',
    defaultPercent: 0, // Set dynamically from user's saving_target_percent
  },
  food: {
    groupId: 'food',
    name: 'Thức ăn & Đồ uống',
    icon: '🍜',
    color: '#F59E0B',
    defaultPercent: 25,
  },
  home: {
    groupId: 'home',
    name: 'Nhà',
    icon: '🏠',
    color: '#10B981',
    defaultPercent: 15,
  },
  transport: {
    groupId: 'transport',
    name: 'Giao thông',
    icon: '🚗',
    color: '#64748B',
    defaultPercent: 10,
  },
  entertainment: {
    groupId: 'entertainment',
    name: 'Giải trí',
    icon: '🎮',
    color: '#8B5CF6',
    defaultPercent: 7,
  },
  shopping: {
    groupId: 'shopping',
    name: 'Mua sắm',
    icon: '🛍️',
    color: '#EC4899',
    defaultPercent: 8,
  },
  other: {
    groupId: 'uncategorized',
    name: 'Khác',
    icon: '📦',
    color: '#6B7280',
    defaultPercent: 35, // Remaining percentage
  },
};

/**
 * Categories that should be excluded from Smart Budget calculation.
 * These wallet types are not included in total asset calculation.
 */
export const EXCLUDED_WALLET_TYPES = ['SAVING', 'DEBT', 'EVENT'];

/**
 * Get all Smart Budget category keys (excluding savings which is special).
 */
export function getSmartBudgetCategoryKeys(): string[] {
  return Object.keys(SMART_BUDGET_CATEGORIES);
}

/**
 * Get Smart Budget category config by key.
 */
export function getSmartBudgetCategory(key: string): SmartBudgetCategoryConfig | undefined {
  return SMART_BUDGET_CATEGORIES[key];
}
