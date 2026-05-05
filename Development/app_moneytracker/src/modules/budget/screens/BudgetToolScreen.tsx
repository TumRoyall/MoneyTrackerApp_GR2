import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/money';

type PeriodType = 'monthly' | 'custom';

const formatDateVi = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day} thg ${month}, ${year}`;
};

const getMonthlyEndDate = (startDateIso: string) => {
  const [year, month, day] = startDateIso.split('-').map(Number);
  if (!year || !month || !day) {
    return startDateIso;
  }

  const start = new Date(year, month - 1, day);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1);
  return `${end.getFullYear()}-${`${end.getMonth() + 1}`.padStart(2, '0')}-${`${end.getDate()}`.padStart(2, '0')}`;
};

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BudgetToolScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getBudgets, createBudget } = useBudgetUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [amountLimitInput, setAmountLimitInput] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [periodStart, setPeriodStart] = useState(toIsoDate(new Date()));
  const [periodEndCustom, setPeriodEndCustom] = useState(toIsoDate(new Date()));
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showAllWallets, setShowAllWallets] = useState(true);

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const budgets = budgetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

  const expenseCategories = useMemo(
    () => categories.filter((item) => String(item.type || '').toUpperCase() === 'EXPENSE'),
    [categories],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const walletMap = useMemo(
    () => new Map(wallets.map((item) => [item.walletId, item])),
    [wallets],
  );

  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].walletId);
    }
  }, [selectedWalletId, wallets]);

  const filteredBudgets = useMemo(() => {
    if (showAllWallets || !selectedWalletId) {
      return budgets;
    }
    return budgets.filter((budget) => budget.walletId === selectedWalletId);
  }, [budgets, selectedWalletId, showAllWallets]);

  const createBudgetHandler = async () => {
    const amountLimit = parseMoneyInput(amountLimitInput);
    if (!selectedWalletId) {
      Alert.alert('Thiếu ví', 'Vui lòng chọn ví cho ngân sách.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Thiếu danh mục', 'Vui lòng chọn danh mục cho ngân sách.');
      return;
    }
    if (!Number.isFinite(amountLimit) || amountLimit <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền ngân sách lớn hơn 0.');
      return;
    }

    const periodEnd = periodType === 'monthly' ? getMonthlyEndDate(periodStart) : periodEndCustom;

    try {
      await createBudget({
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
        amountLimit,
        periodStart,
        periodEnd,
        periodType,
      });
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowCreateModal(false);
      setAmountLimitInput('');
      setPeriodType('monthly');
      setPeriodStart(toIsoDate(new Date()));
      setPeriodEndCustom(toIsoDate(new Date()));
      setSelectedCategoryId('');
      Alert.alert('Thành công', 'Đã tạo ngân sách mới.');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo ngân sách. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>Ngân sách</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.walletToggleRow}>
          <Text style={styles.walletToggleLabel}>Hiển thị tất cả ví</Text>
          <Switch
            value={showAllWallets}
            onValueChange={setShowAllWallets}
            trackColor={{ false: '#d4dde3', true: '#33c3cd' }}
            thumbColor={showAllWallets ? '#ffffff' : '#f1f5f8'}
          />
        </View>

        {!showAllWallets ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}
          >
            {wallets.map((wallet) => {
              const selected = selectedWalletId === wallet.walletId;
              return (
                <Pressable
                  key={wallet.walletId}
                  style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                  onPress={() => setSelectedWalletId(wallet.walletId)}
                >
                  <Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                    {wallet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {budgetsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải ngân sách...</Text>
          </View>
        ) : filteredBudgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có ngân sách</Text>
            <Text style={styles.emptyText}>Bạn có thể tạo ngân sách đầu tiên bằng nút bên dưới.</Text>
          </View>
        ) : (
          filteredBudgets.map((budget) => {
            const category = budget.categoryId ? categoryMap.get(budget.categoryId) : undefined;
            const wallet = budget.walletId ? walletMap.get(budget.walletId) : undefined;
            const spent = Number(
              budget.spentAmount ?? (budget.remainingAmount == null ? 0 : budget.amountLimit - budget.remainingAmount),
            );
            const percent = budget.amountLimit > 0 ? Math.min((spent / budget.amountLimit) * 100, 100) : 0;

            return (
              <Pressable
                key={budget.budgetId}
                style={styles.budgetCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/budgets/[budgetId]',
                    params: { budgetId: budget.budgetId },
                  })
                }
              >
                <Text style={styles.budgetTitle}>{category?.name || 'Ngân sách'}</Text>

                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipIcon}>{category?.icon || '💸'}</Text>
                  <Text style={styles.categoryChipText}>{category?.name || 'Danh mục'}</Text>
                </View>

                {wallet ? <Text style={styles.walletName}>{wallet.name}</Text> : null}

                <Text style={styles.budgetSummary}>
                  Đã dùng <Text style={styles.remainingText}>{Math.round(percent)}%</Text> ngân sách
                </Text>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>{formatDateVi(budget.periodStart)}</Text>
                  <Text style={styles.footerText}>{formatDateVi(budget.periodEnd)}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Thêm ngân sách</Text>
      </Pressable>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo ngân sách</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <View style={styles.periodRow}>
              <Pressable
                style={[styles.periodChip, periodType === 'monthly' ? styles.periodChipActive : null]}
                onPress={() => setPeriodType('monthly')}
              >
                <Text style={[styles.periodChipText, periodType === 'monthly' ? styles.periodChipTextActive : null]}>
                  Hàng tháng
                </Text>
              </Pressable>
              <Pressable
                style={[styles.periodChip, periodType === 'custom' ? styles.periodChipActive : null]}
                onPress={() => setPeriodType('custom')}
              >
                <Text style={[styles.periodChipText, periodType === 'custom' ? styles.periodChipTextActive : null]}>
                  Tùy chỉnh
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Số tiền ngân sách"
              keyboardType="numeric"
              value={amountLimitInput}
              onChangeText={(value) => setAmountLimitInput(formatMoneyInput(value))}
            />
            <TextInput
              style={styles.input}
              placeholder="Ngày bắt đầu (YYYY-MM-DD)"
              value={periodStart}
              onChangeText={setPeriodStart}
            />
            {periodType === 'custom' ? (
              <TextInput
                style={styles.input}
                placeholder="Ngày kết thúc (YYYY-MM-DD)"
                value={periodEndCustom}
                onChangeText={setPeriodEndCustom}
              />
            ) : null}

            <Text style={styles.sectionLabel}>Chọn ví</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}
            >
              {wallets.length === 0 ? (
                <View style={styles.walletEmptyChip}>
                  <Text style={styles.walletEmptyText}>Chưa có ví</Text>
                </View>
              ) : (
                wallets.map((wallet) => {
                  const selected = selectedWalletId === wallet.walletId;
                  return (
                    <Pressable
                      key={wallet.walletId}
                      onPress={() => setSelectedWalletId(wallet.walletId)}
                      style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                    >
                      <Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                        {wallet.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Text style={styles.sectionLabel}>Danh mục chi phí</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {expenseCategories.map((item) => {
                const selected = selectedCategoryId === item.categoryId;
                return (
                  <Pressable
                    key={item.categoryId}
                    onPress={() => setSelectedCategoryId(item.categoryId)}
                    style={[styles.categoryOption, selected ? styles.categoryOptionActive : null]}
                  >
                    <Text style={styles.categoryOptionIcon}>{item.icon || '💸'}</Text>
                    <Text style={[styles.categoryOptionText, selected ? styles.categoryOptionTextActive : null]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.saveBtn} onPress={createBudgetHandler}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 120,
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
    fontSize: 30,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  walletToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  walletToggleLabel: {
    fontSize: 14,
    color: '#4b5963',
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ecef',
    padding: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
  },
  budgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#14b8c4',
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
  },
  budgetTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f1f1f',
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
    fontSize: 22,
    color: '#2a333a',
    fontWeight: '600',
  },
  walletName: {
    fontSize: 14,
    color: '#5b6770',
    fontWeight: '600',
  },
  budgetSummary: {
    fontSize: 15,
    color: '#4b5963',
  },
  remainingText: {
    color: '#129f8a',
    fontWeight: '700',
  },
  totalText: {
    color: '#1f1f1f',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e8edf0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 999,
    backgroundColor: '#22648e',
    paddingHorizontal: 18,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#edf1f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: '#29bcc8',
  },
  periodChipText: {
    color: '#3b4750',
    fontSize: 14,
    fontWeight: '700',
  },
  periodChipTextActive: {
    color: '#fff',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  sectionLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#5d6972',
  },
  walletRow: {
    gap: 8,
    paddingBottom: 6,
  },
  walletChip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9e2e8',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletChipActive: {
    borderColor: '#29bcc8',
    backgroundColor: '#e9fbfd',
  },
  walletChipText: {
    fontSize: 13,
    color: '#3a464e',
    fontWeight: '600',
  },
  walletChipTextActive: {
    color: '#0f8c95',
  },
  walletEmptyChip: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f8',
  },
  walletEmptyText: {
    fontSize: 13,
    color: '#7b868d',
    fontWeight: '600',
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 6,
  },
  categoryOption: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9e2e8',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  categoryOptionActive: {
    borderColor: '#29bcc8',
    backgroundColor: '#e9fbfd',
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#3a464e',
    fontWeight: '600',
  },
  categoryOptionTextActive: {
    color: '#0f8c95',
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
