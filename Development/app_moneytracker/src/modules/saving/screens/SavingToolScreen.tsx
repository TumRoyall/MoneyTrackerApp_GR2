import { useMemo, useState } from 'react';
import { X, Plus, Wallet, ChevronUp, ChevronDown, Calendar, Pencil, PiggyBank } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  BackButton,
  Button,
  Card,
  EmptyState,
  FAB,
  ProgressBar,
  Switch,
  DatePickerModal,
  colors,
  typography,
} from '@/components/common';
import { useSavingUsecases } from '@/modules/saving/usecases';
import { SavingPeriodUnit, SavingType } from '@/modules/saving/models/saving.types';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

const currencyOptions = ['VND', 'USD', 'EUR'];

const normalizeSavingType = (value: unknown): SavingType => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'periodic' ? 'periodic' : 'one_time';
};

const normalizePeriodUnit = (value: unknown): SavingPeriodUnit => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'yearly' ? 'yearly' : 'monthly';
};

const normalizeCategoryType = (value: unknown) => String(value || '').toUpperCase();

const formatPeriodLabel = (unit: SavingPeriodUnit) => (unit === 'yearly' ? 'Mỗi năm' : 'Mỗi tháng');

const formatPeriodChip = (unit: SavingPeriodUnit, anchor: Date) => {
  if (unit === 'yearly') {
    return `Năm ${anchor.getFullYear()}`;
  }
  return `Tháng ${anchor.getMonth() + 1}`;
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

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sumSignedAmount = (items: Array<{ categoryId: string; amount: number; type?: string }>, categoryMap: Map<string, { type?: string }>) =>
  items.reduce((sum, item) => {
    const type = normalizeCategoryType(categoryMap.get(item.categoryId)?.type || item.type);
    if (!type) {
      console.warn('sumSignedAmount: transaction type is undefined/empty, defaulting to INCOME treatment');
    }
    if (type === 'EXPENSE') {
      return sum - Number(item.amount || 0);
    }
    return sum + Number(item.amount || 0);
  }, 0);

export const SavingToolScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getSavings, createSaving } = useSavingUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getTransactions } = useTransactionUsecases();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingType, setSavingType] = useState<SavingType>('periodic');
  const [periodUnit, setPeriodUnit] = useState<SavingPeriodUnit>('monthly');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  const savingsQuery = useQuery({
    queryKey: ['savings'],
    queryFn: getSavings,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const savings = savingsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const totalSavedAllTime = useMemo(
    () => savings.reduce((sum, saving) => sum + Number(saving.currentBalance || 0), 0),
    [savings],
  );

  const periodicSavings = useMemo(
    () => savings.filter((saving) => normalizeSavingType(saving.type) === 'periodic'),
    [savings],
  );

  const periodTransactionsQueries = useQueries({
    queries: periodicSavings.map((saving) => {
      const unit = normalizePeriodUnit(saving.periodUnit);
      const range = getPeriodRange(unit, new Date());
      return {
        queryKey: ['saving-period-transactions', saving.savingId, toIsoDate(range.fromDate), toIsoDate(range.toDate)],
        queryFn: () =>
          getTransactions({
            walletId: saving.walletId,
            fromDate: toIsoDate(range.fromDate),
            toDate: toIsoDate(range.toDate),
            page: 0,
            size: 1000,
            sort: 'date,desc',
          }),
        enabled: Boolean(saving.walletId),
      };
    }),
  });

  const transactionsBySavingId = useMemo(() => {
    return new Map(
      periodicSavings.map((saving, index) => [saving.savingId, periodTransactionsQueries[index]?.data ?? []]),
    );
  }, [periodicSavings, periodTransactionsQueries]);

  const filteredSavings = useMemo(() => {
    if (!hideCompleted) {
      return savings;
    }
    return savings.filter((saving) => {
      const type = normalizeSavingType(saving.type);
      if (type === 'one_time') {
        const total = Number(saving.currentBalance || 0);
        return total < saving.targetAmount;
      }
      const unit = normalizePeriodUnit(saving.periodUnit);
      const transactions = transactionsBySavingId.get(saving.savingId) ?? [];
      const saved = sumSignedAmount(transactions, categoryMap);
      return saved < saving.targetAmount;
    });
  }, [hideCompleted, savings, transactionsBySavingId, categoryMap]);

  const createSavingHandler = async () => {
    const targetAmount = parseMoneyInput(targetInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề mục tiêu tiết kiệm.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền mục tiêu lớn hơn 0.');
      return;
    }
    if (savingType === 'periodic' && !periodUnit) {
      Alert.alert('Thiếu chu kỳ', 'Vui lòng chọn chu kỳ tiết kiệm.');
      return;
    }

    try {
      await createSaving({
        title: titleInput.trim(),
        targetAmount,
        currency,
        type: savingType,
        periodUnit: savingType === 'periodic' ? periodUnit : undefined,
        targetDate: savingType === 'one_time' ? toIsoDate(targetDate) : undefined,
      });

      if (savingType === 'one_time' && targetDate) {
         const triggerDate = new Date(targetDate);
         triggerDate.setDate(triggerDate.getDate() - 3);
         triggerDate.setHours(9, 0, 0, 0);
         if (triggerDate > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Nhắc nhở Tiết kiệm',
                body: `Mục tiêu "${titleInput.trim()}" của bạn sắp đến hạn vào ngày ${toIsoDate(targetDate)}. Bạn đã đạt mục tiêu chưa?`,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
              },
            });
         }
      }

      await queryClient.invalidateQueries({ queryKey: ['savings'] });
      setShowCreateModal(false);
      setTitleInput('');
      setTargetInput('');
      setSavingType('periodic');
      setPeriodUnit('monthly');
      setCurrency('VND');
      setTargetDate(new Date());
      Alert.alert('Thành công', 'Đã tạo mục tiêu tiết kiệm mới.');
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.response?.data?.message || '';
      if (msg === 'Wallet name already exists' || msg.includes('exists')) {
        Alert.alert('Tên mục tiêu đã tồn tại', 'Tên này đã được sử dụng (ví tiết kiệm trùng tên). Vui lòng chọn một tên khác.');
      } else {
        Alert.alert('Lỗi', 'Không thể tạo mục tiêu tiết kiệm. Vui lòng thử lại.');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools" />
          <Text style={styles.title}>Tiết kiệm</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ẩn đã hoàn thành</Text>
          <Switch value={hideCompleted} onValueChange={setHideCompleted} />
        </View>

        <Card variant="elevated" style={styles.totalSummaryCard}>
          <Wallet size={18} color="#2bb6c2" />
          <Text style={styles.totalSummaryText}>Tổng đã tiết kiệm</Text>
          <Text style={styles.totalSummaryAmount}>{formatVndAmount(totalSavedAllTime)}</Text>
        </Card>

        {savingsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải mục tiêu tiết kiệm...</Text>
          </View>
        ) : filteredSavings.length === 0 ? (
          <EmptyState
            icon="PiggyBank"
            iconLibrary="lucide"
            title="Chưa có mục tiêu tiết kiệm"
            description="Hãy tạo mục tiêu tiết kiệm đầu tiên của bạn."
            action={{
              title: 'Tạo mục tiêu',
              onPress: () => setShowCreateModal(true),
            }}
          />
        ) : (
          filteredSavings.map((saving) => {
            const type = normalizeSavingType(saving.type);
            const unit = normalizePeriodUnit(saving.periodUnit);
            const totalSavedAllTime = Number(saving.currentBalance || 0);
            const progressTarget = saving.targetAmount;

            let progressValue = totalSavedAllTime;
            if (type === 'periodic') {
              const transactions = transactionsBySavingId.get(saving.savingId) ?? [];
              progressValue = sumSignedAmount(transactions, categoryMap);
            }

            const percent = progressTarget > 0 ? Math.max(0, Math.min((progressValue / progressTarget) * 100, 100)) : 0;

            let isOverdue = false;
            if (saving.targetDate) {
              const target = new Date(saving.targetDate);
              const today = new Date();
              target.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              isOverdue = target.getTime() < today.getTime();
            }

            return (
              <Card
                key={saving.savingId}
                variant="elevated"
                style={styles.savingCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/tools/savings/[savingId]',
                    params: { savingId: saving.savingId },
                  })
                }
              >
                <View style={styles.savingCardHeader}>
                  <Text style={styles.savingTitle}>{saving.title}</Text>
                  <Pressable
                    hitSlop={10}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push({
                        pathname: '/(tabs)/tools/savings/[savingId]/edit',
                        params: { savingId: saving.savingId },
                      });
                    }}
                    style={styles.editButton}
                  >
                    <Pencil size={16} color="#1f1f1f" />
                  </Pressable>
                </View>

                <View style={styles.amountRow}>
                  <Wallet size={20} color={type === 'periodic' ? '#2bb6c2' : '#f9a826'} style={{ marginRight: 2 }} />
                  <Text style={[styles.amountPrimary, { color: type === 'periodic' ? '#2bb6c2' : '#f9a826' }]}>{formatVndAmount(progressValue)}</Text>
                  <Text style={styles.amountSecondary}>/ {formatVndAmount(progressTarget)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={[styles.typeChip, type === 'one_time' && styles.typeChipOneTime]}>
                    <Text style={[styles.typeChipText, type === 'one_time' && styles.typeChipTextOneTime]}>
                      {type === 'periodic' ? 'Định kỳ' : 'Một lần'}
                    </Text>
                  </View>
                  {type === 'periodic' ? (
                    <>
                      <Text style={styles.metaText}>{formatPeriodLabel(unit)}</Text>
                      <Text style={styles.metaText}>•</Text>
                      <Text style={styles.metaText}>{formatPeriodChip(unit, new Date())}</Text>
                      {saving.targetDate && (
                        <>
                          <Text style={styles.metaText}>•</Text>
                          <Text style={[styles.metaText, isOverdue ? { color: '#e53935' } : null]}>
                            Hạn: {saving.targetDate}
                          </Text>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.metaText}>Tổng tiết kiệm: {formatVndAmount(totalSavedAllTime)}</Text>
                      {saving.targetDate && (
                        <>
                          <Text style={styles.metaText}>•</Text>
                          <Text style={[styles.metaText, isOverdue ? { color: '#e53935' } : null]}>
                            Hạn: {saving.targetDate}
                          </Text>
                        </>
                      )}
                    </>
                  )}
                </View>

                <ProgressBar value={percent} showLabel />
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB icon={<Plus />} label="Thêm mục tiêu" onPress={() => setShowCreateModal(true)} />

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo mục tiêu tiết kiệm</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#333" />
              </Pressable>
            </View>

            <View style={styles.typeToggleRow}>
              {(['one_time', 'periodic'] as SavingType[]).map((type) => {
                const selected = savingType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeToggleButton, selected ? styles.typeToggleButtonActive : null]}
                    onPress={() => setSavingType(type)}
                  >
                    <Text style={[styles.typeToggleText, selected ? styles.typeToggleTextActive : null]}>
                      {type === 'one_time' ? 'Một lần' : 'Định kỳ'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {savingType === 'periodic' ? (
              <View style={styles.dropdownWrapper}>
                <Pressable
                  style={styles.dropdownInput}
                  onPress={() => setShowPeriodDropdown((current) => !current)}
                >
                  <Text style={styles.dropdownText}>
                    {periodUnit === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                  </Text>
                  {showPeriodDropdown ? <ChevronUp size={18} color="#3a464e" /> : <ChevronDown size={18} color="#3a464e" />}
                </Pressable>
                {showPeriodDropdown ? (
                  <View style={styles.dropdownMenu}>
                    {([
                      { value: 'monthly' as SavingPeriodUnit, label: 'Hàng tháng' },
                      { value: 'yearly' as SavingPeriodUnit, label: 'Hàng năm' },
                    ]).map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setPeriodUnit(option.value);
                          setShowPeriodDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownMenuItemText}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.dropdownWrapper}>
                <Text style={styles.noteText}>Ngày mục tiêu</Text>
                <Pressable
                  style={[styles.dropdownInput, { marginTop: 4 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dropdownText}>{toIsoDate(targetDate)}</Text>
                  <Calendar size={18} color="#3a464e" />
                </Pressable>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền tiết kiệm"
              keyboardType="numeric"
              value={targetInput}
              onChangeText={(value) => setTargetInput(formatMoneyInput(value))}
            />

            <View style={styles.dropdownWrapper}>
              <Pressable
                style={styles.dropdownInput}
                onPress={() => setShowCurrencyDropdown((current) => !current)}
              >
                <Text style={styles.dropdownText}>Tiền tệ - {currency}</Text>
                {showCurrencyDropdown ? <ChevronUp size={18} color="#3a464e" /> : <ChevronDown size={18} color="#3a464e" />}
              </Pressable>
              {showCurrencyDropdown ? (
                <View style={styles.dropdownMenu}>
                  {currencyOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setCurrency(option);
                        setShowCurrencyDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownMenuItemText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={styles.noteText}>Ví tiết kiệm sẽ được tạo tự động với tên mục tiêu.</Text>

            <Button title="Lưu" onPress={createSavingHandler} style={styles.saveBtn} />
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={targetDate}
        title="Chọn ngày mục tiêu"
        onConfirm={(date) => {
          setTargetDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
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
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    color: '#4b5963',
    fontWeight: '500',
  },
  savingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe7eb',
    backgroundColor: '#fff',
    padding: 14,
    gap: 8,
  },
  savingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  savingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  editButton: {
    padding: 6,
    backgroundColor: '#f2f5f7',
    borderRadius: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  amountSecondary: {
    fontSize: 13,
    color: '#6b7680',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: '#6b7680',
    fontWeight: '500',
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e8f9fb',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1099a4',
  },
  typeChipOneTime: {
    backgroundColor: '#fff4e5',
  },
  typeChipTextOneTime: {
    color: '#e58e00',
  },
  totalSummaryCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4edf0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalSummaryText: {
    flex: 1,
    fontSize: 12,
    color: '#4d5b64',
  },
  totalSummaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
  },
  typeToggleButtonActive: {
    backgroundColor: '#2bb6c2',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5963',
  },
  typeToggleTextActive: {
    color: '#fff',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f1f1f',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  dropdownInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1f1f1f',
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    backgroundColor: '#fff',
    paddingVertical: 6,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#1f1f1f',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: '#6b7680',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: colors.backgroundPrimary,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e4edf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 8,
  },
});
