import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { formatVndAmount } from '@/shared/utils/money';

const normalizeApiDate = (dateInfo: any) => {
  if (!dateInfo) return undefined;
  if (Array.isArray(dateInfo)) {
    const [year, month, day] = dateInfo.map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(dateInfo);
};

const BUDGET_THEMES = [
  { line: '#60c5d1', track: '#e0f4f6', bg: '#f4fbfb' },
  { line: '#8bc3ed', track: '#e8f3fb', bg: '#f6fafe' },
  { line: '#f6c04b', track: '#fdf2d9', bg: '#fefaf2' },
  { line: '#ef7d83', track: '#fce5e6', bg: '#fef5f6' },
  { line: '#a98ff0', track: '#ede8fb', bg: '#f8f6fd' },
  { line: '#79d7a5', track: '#e4f7ed', bg: '#f5fcf8' },
];

export const BudgetSummaryWidget = ({ categories }: { categories: any[] }) => {
  const router = useRouter();
  const { getBudgets } = useBudgetUsecases();
  const { getTransactions } = useTransactionUsecases();

  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const transactionsQuery = useQuery({ 
    queryKey: ['transactions-all-for-budgets'], 
    queryFn: () => getTransactions({ page: 0, size: 5000, sort: 'date,desc' }) 
  });

  const budgets = budgetsQuery.data ?? [];
  const allTransactions = transactionsQuery.data ?? [];

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const budgetSpentAmounts = useMemo(() => {
    const map = new Map<string, number>();

    budgets.forEach((budget) => {
      const categoryIdSet = new Set(
        budget.categoryIds ?? (budget.categoryId ? [budget.categoryId] : []),
      );

      const startIso = normalizeApiDate(budget.periodStart) || '';
      const endIso = normalizeApiDate(budget.periodEnd) || '';

      const spent = allTransactions.reduce((sum, item) => {
        if (!categoryIdSet.has(item.categoryId)) return sum;
        const itemDate = normalizeApiDate(item.date) || '';
        if (itemDate < startIso || itemDate > endIso) return sum;
        return sum + Number(item.amount || 0);
      }, 0);

      map.set(budget.budgetId, spent);
    });

    return map;
  }, [budgets, allTransactions]);

  if (budgetsQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Đang tải ngân sách...</Text>
      </View>
    );
  }

  if (budgets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.titleContainer} 
        onPress={() => router.navigate('/(tabs)/tools/budgets')}
        hitSlop={10}
      >
        <Text style={styles.title}>Tổng quan Ngân sách</Text>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </Pressable>
      <View style={styles.list}>
        {budgets.map((budget, index) => {
            const categoriesForBudget = (budget.categoryIds ?? (budget.categoryId ? [budget.categoryId] : []))
              .map((id) => categoryMap.get(id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));
            const categoryName = categoriesForBudget[0]?.name || budget.title || 'Ngân sách';
            const categoryIcon = categoriesForBudget[0]?.icon || null;
            const spent = budgetSpentAmounts.get(budget.budgetId) ?? 0;
            const targetAmount = budget.amountLimit;
            const percent = targetAmount > 0 ? Math.min((spent / targetAmount) * 100, 100) : 0;
            const remainingAmount = Math.max(targetAmount - spent, 0);
            
            const theme = BUDGET_THEMES[index % BUDGET_THEMES.length];
            const isOver = percent >= 100;
            const lineColor = isOver ? '#ef4444' : theme.line;
            
            return (
              <Pressable 
                key={budget.budgetId} 
                style={[styles.budgetItem, { backgroundColor: theme.bg }]}
                onPress={() => router.push({
                  pathname: '/(tabs)/tools/budgets/[budgetId]/edit',
                  params: { budgetId: budget.budgetId }
                })}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetIconName}>
                    <CategoryIcon icon={categoryIcon} size={16} color={lineColor} />
                    <Text style={styles.budgetName} numberOfLines={1}>{categoryName}</Text>
                  </View>
                  <Text style={[styles.budgetPercent, { color: lineColor }]}>{Math.round(percent)}%</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.track }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: lineColor }]} />
                </View>
                <Text style={styles.budgetRemaining}>
                  {isOver ? `Vượt quá ${formatVndAmount(Math.abs(spent - targetAmount))}` : `Còn lại ${formatVndAmount(remainingAmount)}`}
                </Text>
              </Pressable>
            );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  budgetItem: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  budgetPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});
