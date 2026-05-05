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

  const category = useMemo(
    () => categories.find((item) => item.categoryId === budget?.categoryId),
    [categories, budget?.categoryId],
  );

  const wallet = useMemo(
    () => wallets.find((item) => item.walletId === budget?.walletId),
    [wallets, budget?.walletId],
  );

  const transactionsQuery = useQuery({
    queryKey: ['budget-transactions', budget?.budgetId],
    queryFn: () =>
      getTransactions({
        walletId: budget?.walletId,
        categoryId: budget?.categoryId,
        fromDate: budget?.periodStart,
        toDate: budget?.periodEnd,
        type: 'EXPENSE',
        page: 0,
        size: 200,
        sort: 'date,desc',
      }),
    enabled: Boolean(budget?.walletId && budget?.categoryId),
  });

  const transactions = transactionsQuery.data ?? [];

  const spentAmount = useMemo(() => {
    if (budget?.spentAmount != null) {
      return budget.spentAmount;
    }
    return transactions.reduce((sum, item) => sum + item.amount, 0);
  }, [budget?.spentAmount, transactions]);

  const remainingAmount = budget ? budget.amountLimit - spentAmount : 0;
  const percent = budget && budget.amountLimit > 0 ? Math.min((spentAmount / budget.amountLimit) * 100, 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>{category?.name || 'Ngân sách'}</Text>
          <View style={{ width: 24 }} />
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
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipIcon}>{category?.icon || '💸'}</Text>
              <Text style={styles.categoryChipText}>{category?.name || 'Danh mục'}</Text>
            </View>
            {wallet ? <Text style={styles.walletName}>{wallet.name}</Text> : null}

            <Text style={styles.summaryText}>
              {formatVndAmount(spentAmount)} / {formatVndAmount(budget.amountLimit)}
            </Text>
            <Text style={styles.percentText}>{Math.round(percent)}%</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{formatDateVi(budget.periodStart)}</Text>
              <Text style={styles.footerText}>{formatDateVi(budget.periodEnd)}</Text>
            </View>

            <Text style={styles.remainingText}>Còn lại {formatVndAmount(remainingAmount)}</Text>
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
  categoryChip: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  categoryChipIcon: {
    fontSize: 20,
  },
  categoryChipText: {
    fontSize: 18,
    color: '#2a333a',
    fontWeight: '700',
  },
  walletName: {
    fontSize: 14,
    color: '#5b6770',
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  percentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#129f8a',
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 13,
    color: '#667179',
  },
  remainingText: {
    fontSize: 14,
    color: '#4b5963',
    fontWeight: '600',
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
