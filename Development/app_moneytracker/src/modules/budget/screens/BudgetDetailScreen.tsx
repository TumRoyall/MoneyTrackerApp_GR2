import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatVndAmount } from '@/shared/utils/money';

const formatDateVi = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day} thg ${month}, ${year}`;
};

export const BudgetDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ budgetId?: string }>();
  const budgetId = params.budgetId || '';

  const { getBudget } = useBudgetUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();
  const { getTransactions } = useTransactionUsecases();

  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => getBudget(budgetId),
    enabled: Boolean(budgetId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const budget = budgetQuery.data;
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const budgetCategoryIds = useMemo(
    () => budget?.categoryIds ?? (budget?.categoryId ? [budget.categoryId] : []),
    [budget?.categoryId, budget?.categoryIds],
  );

  const categoriesForBudget = useMemo(
    () =>
      budgetCategoryIds
        .map((id) => categories.find((item) => item.categoryId === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [budgetCategoryIds, categories],
  );
  const isIncome = categoriesForBudget[0]?.type === 'INCOME';

  const category = useMemo(
    () => categories.find((item) => item.categoryId === budget?.categoryId),
    [categories, budget?.categoryId],
  );

  const wallet = useMemo(
    () => wallets.find((item) => item.walletId === budget?.walletId),
    [wallets, budget?.walletId],
  );

  const transactionsQuery = useQuery({
    queryKey: ['budget-transactions', budget?.budgetId, budget?.walletId, budget?.periodStart, budget?.periodEnd],
    queryFn: () =>
      getTransactions({
        walletId: budget?.walletId ?? undefined,
        fromDate: budget?.periodStart,
        toDate: budget?.periodEnd,
        page: 0,
        size: 500,
        sort: 'date,desc',
      }),
    enabled: Boolean(budget?.walletId && budget?.periodStart && budget?.periodEnd && budgetCategoryIds.length > 0),
  });

  const transactions = useMemo(() => {
    const rows = transactionsQuery.data ?? [];
    if (!budget) {
      return [];
    }
    const categorySet = new Set(budgetCategoryIds);
    return rows.filter((item) => {
      if (item.walletId !== budget.walletId) {
        return false;
      }
      if (!categorySet.has(item.categoryId)) {
        return false;
      }
      return item.date >= budget.periodStart && item.date <= budget.periodEnd;
    });
  }, [transactionsQuery.data, budget, budgetCategoryIds]);

  const spentAmount = useMemo(() => transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0), [transactions]);

  const remainingAmount = budget ? budget.amountLimit - spentAmount : 0;
  const percent = budget && budget.amountLimit > 0 ? Math.min((spentAmount / budget.amountLimit) * 100, 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/tools/budgets')}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>{budget?.title?.trim() || category?.name || 'Ngân sách'}</Text>
          {budget ? (
            <Pressable
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/tools/budgets/[budgetId]/edit',
                  params: { budgetId },
                })
              }
            >
              <Ionicons name="pencil" size={20} color="#1f1f1f" />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {budgetQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải ngân sách...</Text>
          </View>
        ) : !budget ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Không tìm thấy ngân sách.</Text>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryHeaderLeft}>
                <Text style={styles.summaryTitle}>Tổng quan</Text>
                {wallet ? <Text style={styles.walletName}>{wallet.name}</Text> : null}
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{Math.round(percent)}%</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categoriesForBudget.length === 0 ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillIcon}>💸</Text>
                  <Text style={styles.categoryPillText}>Danh mục</Text>
                </View>
              ) : (
                categoriesForBudget.map((item) => (
                  <View key={item.categoryId} style={styles.categoryPill}>
                    <Text style={styles.categoryPillIcon}>{item.icon || '💸'}</Text>
                    <Text style={styles.categoryPillText}>{item.name}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.amountRow}>
              <Text style={styles.amountSpent}>{formatVndAmount(spentAmount)}</Text>
              <Text style={styles.amountDivider}>/</Text>
              <Text style={styles.amountLimit}>{formatVndAmount(budget.amountLimit)}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Bắt đầu</Text>
                <Text style={styles.metaValue}>{formatDateVi(budget.periodStart)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Kết thúc</Text>
                <Text style={styles.metaValue}>{formatDateVi(budget.periodEnd)}</Text>
              </View>
            </View>

            <View style={styles.insightRow}>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Còn lại</Text>
                <Text style={styles.insightValue}>{formatVndAmount(remainingAmount)}</Text>
              </View>
              <View style={styles.insightCardMuted}>
                <Text style={styles.insightLabel}>{isIncome ? 'Đã thu' : 'Đã chi'}</Text>
                <Text style={styles.insightValue}>{formatVndAmount(spentAmount)}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Giao dịch trong kỳ</Text>

        {transactionsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải giao dịch...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có giao dịch trong kỳ này.</Text>
          </View>
        ) : (
          transactions.map((item) => (
            <View key={item.transactionId} style={styles.transactionRow}>
              <Text style={styles.transactionDate}>{formatDateVi(item.date)}</Text>
              <View style={styles.transactionInfoRow}>
                <Text style={styles.transactionNote}>{item.note || category?.name || 'Chi tiêu'}</Text>
                <Text style={styles.transactionAmount}>- {formatVndAmount(item.amount)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#14b8c4',
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryHeaderLeft: {
    gap: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  summaryBadge: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e9fbfd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f8c95',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  categoryPillIcon: {
    fontSize: 16,
  },
  categoryPillText: {
    fontSize: 14,
    color: '#2a333a',
    fontWeight: '700',
  },
  walletName: {
    fontSize: 14,
    color: '#5b6770',
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountSpent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  amountDivider: {
    fontSize: 16,
    color: '#8c97a1',
    fontWeight: '700',
  },
  amountLimit: {
    fontSize: 16,
    color: '#6b7680',
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e8edf0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: '#29bcc8',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 12,
    color: '#8c97a1',
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 14,
    color: '#37424a',
    fontWeight: '700',
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ecfdfb',
  },
  insightCardMuted: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f6f8fa',
  },
  insightLabel: {
    fontSize: 12,
    color: '#6b7680',
    fontWeight: '700',
  },
  insightValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ecef',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
  },
  transactionRow: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#edf1f5',
    padding: 14,
    gap: 8,
  },
  transactionDate: {
    fontSize: 13,
    color: '#7b868d',
  },
  transactionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  transactionNote: {
    fontSize: 15,
    color: '#1f1f1f',
    fontWeight: '600',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e35d5d',
  },
});
