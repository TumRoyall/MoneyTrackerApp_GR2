import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { useSavingUsecases } from '@/modules/saving/usecases';
import { SavingPeriodUnit, SavingType } from '@/modules/saving/models/saving.types';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { formatVndAmount } from '@/shared/utils/money';

const normalizeSavingType = (value: unknown): SavingType => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'periodic' ? 'periodic' : 'one_time';
};

const normalizePeriodUnit = (value: unknown): SavingPeriodUnit => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'yearly' ? 'yearly' : 'monthly';
};

const normalizeCategoryType = (value: unknown) => String(value || '').toUpperCase();

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPeriodRange = (unit: SavingPeriodUnit, anchor: Date) => {
  if (unit === 'yearly') {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = new Date(anchor.getFullYear(), 11, 31);
    return { fromDate: start, toDate: end };
  }
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { fromDate: start, toDate: end };
};

const formatPeriodChip = (unit: SavingPeriodUnit, anchor: Date) => {
  if (unit === 'yearly') {
    return `Năm ${anchor.getFullYear()}`;
  }
  return `thg ${anchor.getMonth() + 1} ${anchor.getFullYear()}`;
};

const formatPeriodLabel = (unit: SavingPeriodUnit) => (unit === 'yearly' ? 'hàng năm' : 'hàng tháng');

const sumSignedAmount = (items: Array<{ categoryId: string; amount: number }>, categoryMap: Map<string, { type?: string }>) =>
  items.reduce((sum, item) => {
    const type = normalizeCategoryType(categoryMap.get(item.categoryId)?.type);
    if (type === 'EXPENSE') {
      return sum - Number(item.amount || 0);
    }
    return sum + Number(item.amount || 0);
  }, 0);

const ProgressRing = ({ size, strokeWidth, percent }: { size: number; strokeWidth: number; percent: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#edf1f4"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#2bb6c2"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const SavingDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ savingId?: string }>();
  const savingId = params.savingId || '';

  const { getSaving } = useSavingUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getTransactions } = useTransactionUsecases();

  const savingQuery = useQuery({
    queryKey: ['saving', savingId],
    queryFn: () => getSaving(savingId),
    enabled: Boolean(savingId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const saving = savingQuery.data;
  const categories = categoriesQuery.data ?? [];
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());

  const savingType = normalizeSavingType(saving?.type);
  const periodUnit = normalizePeriodUnit(saving?.periodUnit);
  const periodRange = getPeriodRange(periodUnit, periodAnchor);

  const transactionsQuery = useQuery({
    queryKey: ['saving-transactions', savingId, toIsoDate(periodRange.fromDate), toIsoDate(periodRange.toDate)],
    queryFn: () =>
      getTransactions({
        walletId: saving?.walletId ?? undefined,
        fromDate: toIsoDate(periodRange.fromDate),
        toDate: toIsoDate(periodRange.toDate),
        page: 0,
        size: 1000,
        sort: 'date,desc',
      }),
    enabled: Boolean(saving?.walletId && savingType === 'periodic'),
  });

  const transactions = transactionsQuery.data ?? [];
  const periodSaved = savingType === 'periodic' ? sumSignedAmount(transactions, categoryMap) : 0;
  const totalSaved = Number(saving?.currentBalance || 0);
  const targetAmount = saving?.targetAmount ?? 0;
  const progressValue = savingType === 'periodic' ? periodSaved : totalSaved;
  const percent = targetAmount > 0 ? Math.min((progressValue / targetAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(targetAmount - progressValue, 0);

  const movePeriod = (step: number) => {
    setPeriodAnchor((current) => {
      if (periodUnit === 'yearly') {
        return new Date(current.getFullYear() + step, current.getMonth(), 1);
      }
      return new Date(current.getFullYear(), current.getMonth() + step, 1);
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>{saving?.title || 'Tiết kiệm'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#1f1f1f" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>
                {savingType === 'periodic'
                  ? `Định kỳ · ${formatPeriodLabel(periodUnit)}`
                  : 'Một lần'}
              </Text>
            </View>
          </View>

          {savingType === 'periodic' ? (
            <View style={styles.periodNavRow}>
              <Pressable style={styles.navBtn} onPress={() => movePeriod(-1)}>
                <Ionicons name="chevron-back" size={18} color="#5a6770" />
              </Pressable>
              <View style={styles.periodChip}>
                <Text style={styles.periodChipText}>{formatPeriodChip(periodUnit, periodAnchor)}</Text>
              </View>
              <Pressable style={styles.navBtn} onPress={() => movePeriod(1)}>
                <Ionicons name="chevron-forward" size={18} color="#5a6770" />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.progressWrap}>
            <ProgressRing size={180} strokeWidth={14} percent={percent} />
            <View style={styles.progressCenter}>
              <Text style={styles.percentText}>{`${Math.round(percent)}%`}</Text>
              <Text style={styles.percentCaption}>
                {savingType === 'periodic' ? 'kỳ này' : 'toàn thời gian'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Đã tiết kiệm</Text>
              <Text style={styles.statValue}>{formatVndAmount(progressValue)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Còn lại</Text>
              <Text style={styles.statValue}>{formatVndAmount(remainingAmount)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                {savingType === 'periodic'
                  ? `Mục tiêu ${periodUnit === 'yearly' ? 'hàng năm' : 'hàng tháng'}`
                  : 'Mục tiêu'}
              </Text>
              <Text style={styles.statValue}>{formatVndAmount(targetAmount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Ionicons name="wallet" size={18} color="#2bb6c2" />
          <Text style={styles.totalText}>Tổng đã tiết kiệm (toàn thời gian)</Text>
          <Text style={styles.totalAmount}>{formatVndAmount(totalSaved)}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt động</Text>
          <Text style={styles.sectionCount}>0 mục</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Chưa có hồ sơ nào. Nhấn + để thêm giao dịch của bạn.</Text>
        </View>
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
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e3edf1',
    backgroundColor: '#fff',
    padding: 16,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tagChip: {
    backgroundColor: '#e9f6f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2bb6c2',
  },
  periodNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  navBtn: {
    padding: 6,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e7ea',
    backgroundColor: '#f8fbfc',
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b6770',
  },
  progressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2bb6c2',
  },
  percentCaption: {
    fontSize: 12,
    color: '#7c8891',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7b8891',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#edf1f4',
  },
  totalCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4edf0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    flex: 1,
    fontSize: 13,
    color: '#4d5b64',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  sectionHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  sectionCount: {
    fontSize: 12,
    color: '#7b8891',
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e4edf0',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#7b8891',
    textAlign: 'center',
  },
});
