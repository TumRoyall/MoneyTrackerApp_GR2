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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/money';

type PeriodType = 'monthly' | 'biweekly' | 'weekly' | 'yearly';
type CategoryType = 'EXPENSE' | 'INCOME';
type CalendarTarget = 'day';

const formatDateVi = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day} thg ${month}, ${year}`;
};

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map((item) => Number(item));
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const buildCalendarMatrix = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
    const inCurrentMonth = date.getMonth() === monthDate.getMonth();
    return { date, inCurrentMonth };
  });
};

const getPeriodEndDate = (startDateIso: string, periodType: PeriodType) => {
  const [year, month, day] = startDateIso.split('-').map(Number);
  if (!year || !month || !day) {
    return startDateIso;
  }

  const start = new Date(year, month - 1, day);
  const end = new Date(start);

  const preserveDay = start.getDate();
  const normalizeMonthEnd = () => {
    if (end.getDate() !== preserveDay) {
      end.setDate(0);
    }
  };

  switch (periodType) {
    case 'weekly':
      end.setDate(end.getDate() + 6);
      break;
    case 'biweekly':
      end.setDate(end.getDate() + 13);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      normalizeMonthEnd();
      if (end.getDate() === preserveDay) {
        end.setDate(end.getDate() - 1);
      }
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      normalizeMonthEnd();
      if (end.getDate() === preserveDay) {
        end.setDate(end.getDate() - 1);
      }
      break;
    default:
      break;
  }

  return `${end.getFullYear()}-${`${end.getMonth() + 1}`.padStart(2, '0')}-${`${end.getDate()}`.padStart(2, '0')}`;
};

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIsoDate = (value: Date) => toIsoDate(value);

const normalizeCategoryType = (value: unknown): CategoryType => {
  const stringValue = String(value || '').toUpperCase();
  return stringValue === 'INCOME' ? 'INCOME' : 'EXPENSE';
};

const normalizePeriodType = (value?: string): PeriodType => {
  if (value === 'weekly' || value === 'biweekly' || value === 'yearly') {
    return value;
  }
  return 'monthly';
};

export const BudgetEditScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ budgetId?: string }>();
  const budgetId = params.budgetId || '';

  const queryClient = useQueryClient();
  const { getBudget, updateBudget } = useBudgetUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getWallets } = useWalletUsecases();

  const [titleInput, setTitleInput] = useState('');
  const [amountLimitInput, setAmountLimitInput] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [periodStart, setPeriodStart] = useState(toIsoDate(new Date()));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [budgetType, setBudgetType] = useState<CategoryType>('EXPENSE');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget>('day');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [hasInitialized, setHasInitialized] = useState(false);

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

  useEffect(() => {
    if (!hasInitialized && budget) {
      setTitleInput(budget.title ?? '');
      setAmountLimitInput(formatMoneyInput(String(budget.amountLimit)));
      setPeriodType(normalizePeriodType(budget.periodType));
      setPeriodStart(budget.periodStart || toIsoDate(new Date()));
      setSelectedCategoryIds(budget.categoryIds ?? (budget.categoryId ? [budget.categoryId] : []));
      setSelectedWalletId(budget.walletId ?? null);

      const budgetCategory = categories.find(
        (item) => budget.categoryIds?.includes(item.categoryId) || item.categoryId === budget.categoryId,
      );
      if (budgetCategory) {
        setBudgetType(normalizeCategoryType(budgetCategory.type));
      }

      setHasInitialized(true);
    }
  }, [budget, categories, hasInitialized]);

  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].walletId);
    }
  }, [selectedWalletId, wallets]);

  const budgetTypeCategories = useMemo(
    () => categories.filter((item) => normalizeCategoryType(item.type) === budgetType),
    [categories, budgetType],
  );

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }
    setSelectedCategoryIds((current) =>
      current.filter((id) => budgetTypeCategories.some((item) => item.categoryId === id)),
    );
  }, [budgetTypeCategories, categories.length]);

  const selectedCategories = useMemo(
    () => categories.filter((item) => selectedCategoryIds.includes(item.categoryId)),
    [categories, selectedCategoryIds],
  );

  const openCalendarPicker = (target: CalendarTarget, valueIso?: string) => {
    const parsed = valueIso ? parseIsoDate(valueIso) : null;
    const base = parsed ?? new Date();
    setCalendarTarget(target);
    setCalendarSelectedDate(base);
    setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setShowCalendarModal(true);
  };

  const applyCalendarSelection = () => {
    const value = formatIsoDate(calendarSelectedDate);
    if (calendarTarget === 'day') {
      setPeriodStart(value);
    }
    setShowCalendarModal(false);
  };

  const periodEnd = useMemo(() => getPeriodEndDate(periodStart, periodType), [periodStart, periodType]);

  const toggleCategoryId = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const saveBudgetHandler = async () => {
    if (!budgetId) {
      Alert.alert('Lỗi', 'Không tìm thấy ngân sách để cập nhật.');
      return;
    }

    const amountLimit = parseMoneyInput(amountLimitInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề cho ngân sách.');
      return;
    }
    if (!selectedWalletId) {
      Alert.alert('Thiếu ví', 'Vui lòng chọn ví cho ngân sách.');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      Alert.alert('Thiếu danh mục', 'Vui lòng chọn ít nhất một danh mục cho ngân sách.');
      return;
    }
    if (!Number.isFinite(amountLimit) || amountLimit <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền ngân sách lớn hơn 0.');
      return;
    }

    try {
      await updateBudget(budgetId, {
        walletId: selectedWalletId,
        categoryId: selectedCategoryIds[0],
        categoryIds: selectedCategoryIds,
        title: titleInput.trim(),
        amountLimit,
        periodStart,
        periodEnd,
        periodType,
      });
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      await queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      Alert.alert('Thành công', 'Đã cập nhật ngân sách.');
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật ngân sách. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>Chỉnh sửa ngân sách</Text>
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
          <>
            <View style={styles.typeToggleTopRow}>
              {(['EXPENSE', 'INCOME'] as CategoryType[]).map((type) => {
                const selected = budgetType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeToggleButton, selected ? styles.typeToggleButtonActive : null]}
                    onPress={() => {
                      setBudgetType(type);
                      setShowPeriodDropdown(false);
                    }}
                  >
                    <Text style={[styles.typeToggleText, selected ? styles.typeToggleTextActive : null]}>
                      {type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dropdownWrapper}>
              <Pressable style={styles.dropdownInput} onPress={() => setShowPeriodDropdown((current) => !current)}>
                <Text style={styles.dropdownText}>
                  {periodType === 'monthly'
                    ? 'Hàng tháng'
                    : periodType === 'biweekly'
                    ? '2 tuần'
                    : periodType === 'weekly'
                    ? 'Hàng tuần'
                    : 'Hàng năm'}
                </Text>
                <Ionicons name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#3a464e" />
              </Pressable>
              {showPeriodDropdown ? (
                <View style={styles.dropdownMenu}>
                  {[
                    { value: 'monthly' as PeriodType, label: 'Hàng tháng' },
                    { value: 'biweekly' as PeriodType, label: '2 tuần' },
                    { value: 'weekly' as PeriodType, label: 'Hàng tuần' },
                    { value: 'yearly' as PeriodType, label: 'Hàng năm' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setPeriodType(option.value);
                        setShowPeriodDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownMenuItemText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền ngân sách"
              keyboardType="numeric"
              value={amountLimitInput}
              onChangeText={(value) => setAmountLimitInput(formatMoneyInput(value))}
            />
            <View style={styles.dateTypeRow}>
              <Pressable style={styles.calendarInput} onPress={() => openCalendarPicker('day', periodStart)}>
                <Ionicons name="calendar" size={18} color="#29bcc8" />
                <Text style={styles.calendarInputText}>{formatDateVi(periodStart)}</Text>
              </Pressable>
            </View>
            <View style={styles.endDateRow}>
              <Text style={styles.endDateLabel}>Ngày kết thúc</Text>
              <Text style={styles.endDateText}>{formatDateVi(periodEnd)}</Text>
            </View>

            <Text style={styles.sectionLabel}>Danh mục ngân sách</Text>
            <View style={styles.selectedCategoryRow}>
              {selectedCategories.length === 0 ? (
                <Text style={styles.selectedCategoryEmpty}>Chưa có danh mục nào được chọn.</Text>
              ) : (
                selectedCategories.map((item) => (
                  <Pressable
                    key={item.categoryId}
                    style={styles.selectedCategoryChip}
                    onPress={() => toggleCategoryId(item.categoryId)}
                  >
                    <Text style={styles.selectedCategoryIcon}>{item.icon || '💸'}</Text>
                    <Text style={styles.selectedCategoryText}>{item.name}</Text>
                    <Text style={styles.selectedCategoryRemove}>✕</Text>
                  </Pressable>
                ))
              )}
            </View>
            <Pressable style={styles.openCategoryPickerButton} onPress={() => setShowCategoryPickerModal(true)}>
              <Ionicons name="add-circle-outline" size={18} color="#179ea9" />
              <Text style={styles.openCategoryPickerButtonText}>Thêm danh mục</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>Chọn ví</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
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

            <Pressable style={styles.saveBtn} onPress={saveBudgetHandler}>
              <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.calendarCard}>
            <Text style={styles.modalTitle}>Chọn ngày bắt đầu</Text>

            <View style={styles.calendarHeaderRow}>
              <Pressable
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                style={styles.monthNavBtn}
              >
                <Ionicons name="chevron-back" size={18} color="#555" />
              </Pressable>

              <Text style={styles.calendarMonthTitle}>
                {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </Text>

              <Pressable
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                style={styles.monthNavBtn}
              >
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </Pressable>
            </View>

            <View style={styles.calendarWeekdays}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                <Text key={day} style={styles.calendarWeekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {buildCalendarMatrix(calendarMonth).map((cell, index) => {
                const selected = isSameDate(cell.date, calendarSelectedDate);
                return (
                  <Pressable
                    key={`${cell.date.toISOString()}-${index}`}
                    onPress={() => setCalendarSelectedDate(cell.date)}
                    style={[styles.calendarCell, selected ? styles.calendarCellSelected : null]}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        !cell.inCurrentMonth ? styles.calendarCellTextMuted : null,
                        selected ? styles.calendarCellTextSelected : null,
                      ]}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.rangeActionRow}>
              <Pressable style={styles.rangeGhostBtn} onPress={() => setShowCalendarModal(false)}>
                <Text style={styles.rangeGhostBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.rangeConfirmBtn} onPress={applyCalendarSelection}>
                <Text style={styles.rangeConfirmBtnText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryPickerSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <Pressable onPress={() => setShowCategoryPickerModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.categoryPickerContent} showsVerticalScrollIndicator={false}>
              {budgetTypeCategories.length === 0 ? (
                <Text style={styles.selectedCategoryEmpty}>Chưa có danh mục phù hợp.</Text>
              ) : (
                budgetTypeCategories.map((item) => {
                  const selected = selectedCategoryIds.includes(item.categoryId);
                  return (
                    <Pressable
                      key={item.categoryId}
                      onPress={() => toggleCategoryId(item.categoryId)}
                      style={[styles.categoryPickerItem, selected ? styles.categoryPickerItemSelected : null]}
                    >
                      <View style={styles.categoryPickerIconWrap}>
                        <Text style={styles.categoryPickerIcon}>{item.icon || '💸'}</Text>
                      </View>
                      <Text style={[styles.categoryPickerName, selected ? styles.categoryPickerNameSelected : null]}>
                        {item.name}
                      </Text>
                      {selected ? <Text style={styles.categoryPickerSelectedMark}>✓</Text> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Pressable style={styles.categoryPickerDoneButton} onPress={() => setShowCategoryPickerModal(false)}>
              <Text style={styles.categoryPickerDoneButtonText}>Xong</Text>
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
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ecef',
    padding: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
  },
  typeToggleTopRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dropdownWrapper: {
    marginBottom: 10,
  },
  dropdownInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1f1f1f',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eff3f6',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#3a464e',
  },
  typeToggleButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggleButtonActive: {
    borderColor: '#29bcc8',
    backgroundColor: '#e9fbfd',
  },
  typeToggleText: {
    fontSize: 13,
    color: '#3a464e',
    fontWeight: '700',
  },
  typeToggleTextActive: {
    color: '#0f8c95',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateTypeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  calendarInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarInputText: {
    fontSize: 14,
    color: '#1f1f1f',
  },
  endDateRow: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3fafb',
    borderWidth: 1,
    borderColor: '#d9f0f2',
  },
  endDateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5d6972',
    marginBottom: 4,
  },
  endDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  sectionLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#5d6972',
  },
  selectedCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  selectedCategoryEmpty: {
    color: '#667179',
    fontSize: 14,
  },
  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#e9fbfd',
    borderWidth: 1,
    borderColor: '#29bcc8',
  },
  selectedCategoryIcon: {
    fontSize: 16,
  },
  selectedCategoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f8c95',
  },
  selectedCategoryRemove: {
    color: '#0f8c95',
    fontWeight: '700',
  },
  openCategoryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#effbf9',
    marginBottom: 12,
  },
  openCategoryPickerButtonText: {
    color: '#179ea9',
    fontSize: 14,
    fontWeight: '700',
  },
  walletRow: {
    gap: 8,
    paddingBottom: 6,
  },
  walletChip: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e2e8',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f8',
  },
  walletEmptyText: {
    fontSize: 13,
    color: '#7b868d',
    fontWeight: '600',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f8',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calendarWeekdayText: {
    fontSize: 12,
    color: '#74808a',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 4,
  },
  calendarCellSelected: {
    backgroundColor: '#29bcc8',
  },
  calendarCellText: {
    fontSize: 14,
    color: '#1f1f1f',
  },
  calendarCellTextMuted: {
    color: '#b0bdc7',
  },
  calendarCellTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  rangeActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  rangeGhostBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  rangeGhostBtnText: {
    color: '#4b5963',
    fontWeight: '700',
  },
  rangeConfirmBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeConfirmBtnText: {
    color: '#fff',
    fontWeight: '700',
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
