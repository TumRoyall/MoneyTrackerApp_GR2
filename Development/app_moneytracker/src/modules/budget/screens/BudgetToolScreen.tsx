import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

import { Button, Card, FAB, EmptyState, ProgressBar, BackButton, colors, spacing, typography, CategoryPickerModal } from '@/components/common';

import { useBudgetUsecases } from '@/modules/budget/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';
import { SmartBudgetDialog } from '@/modules/budget/components/SmartBudgetDialog';
import { BudgetCard } from '@/modules/budget/components/BudgetCard';

type PeriodType = 'monthly' | 'biweekly' | 'weekly' | 'yearly';

type CategoryType = 'EXPENSE' | 'INCOME';

type CalendarTarget = 'day';

const formatDateVi = (isoDate: any) => {
  if (!isoDate) return '';
  const parts = Array.isArray(isoDate) ? isoDate : String(isoDate).split('-');
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) {
    return Array.isArray(isoDate) ? isoDate.join('-') : String(isoDate);
  }
  return `${day} thg ${month}, ${year}`;
};

const normalizeApiDate = (dateInfo: any) => {
  if (!dateInfo) return undefined;
  if (Array.isArray(dateInfo)) {
    const [year, month, day] = dateInfo.map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(dateInfo);
};

const parseIsoDate = (value: any) => {
  if (!value) return null;
  const parts = Array.isArray(value) ? value : String(value).split('-');
  const [year, month, day] = parts.map((item) => Number(item));
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const normalizeCategoryType = (value: unknown): CategoryType => {
  const stringValue = String(value || '').toUpperCase();
  return stringValue === 'INCOME' ? 'INCOME' : 'EXPENSE';
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

const getPeriodEndDate = (startDateIso: any, periodType: PeriodType) => {
  if (!startDateIso) return startDateIso;
  const parts = Array.isArray(startDateIso) ? startDateIso : String(startDateIso).split('-');
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) {
    return Array.isArray(startDateIso) ? startDateIso.join('-') : String(startDateIso);
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

export const BudgetToolScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getBudgets, createBudget } = useBudgetUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getTransactions } = useTransactionUsecases();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreationChoiceModal, setShowCreationChoiceModal] = useState(false);
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [showSmartBudgetDialog, setShowSmartBudgetDialog] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [amountLimitInput, setAmountLimitInput] = useState('');
  const [alertThresholdInput, setAlertThresholdInput] = useState('80');
  const [enableAlert, setEnableAlert] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [periodStart, setPeriodStart] = useState(toIsoDate(new Date()));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<CategoryType>('EXPENSE');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget>('day');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [showExpired, setShowExpired] = useState(false);

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Fetch all transactions for the current month to calculate spent amounts
  const currentPeriodStart = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const transactionsQuery = useQuery({
    queryKey: ['transactions-all-for-budgets'],
    queryFn: () =>
      getTransactions({
        page: 0,
        size: 5000,
        sort: 'date,desc',
      }),
    enabled: true,
  });

  const budgets = budgetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  const budgetTypeCategories = useMemo(
    () => categories.filter((item) => normalizeCategoryType(item.type) === budgetType),
    [categories, budgetType],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  // Check if budget is expired
  const isBudgetExpired = (endDate: string | undefined | null) => {
    if (!endDate) return false;
    const end = normalizeApiDate(endDate);
    if (!end) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDateObj = new Date(end);
    return endDateObj < today;
  };

  // Separate active and expired budgets
  const { activeBudgets, expiredBudgets } = useMemo(() => {
    const active: typeof budgets = [];
    const expired: typeof budgets = [];
    budgets.forEach((budget) => {
      if (isBudgetExpired(budget.periodEnd)) {
        expired.push(budget);
      } else {
        active.push(budget);
      }
    });
    return { activeBudgets: active, expiredBudgets: expired };
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    // Show active budgets, or active + expired based on toggle
    return showExpired ? [...activeBudgets, ...expiredBudgets] : activeBudgets;
  }, [showExpired, activeBudgets, expiredBudgets]);

  // Filter transactions by period for each budget
  const budgetSpentAmounts = useMemo(() => {
    const map = new Map<string, number>();

    budgets.forEach((budget) => {
      const categoryIdSet = new Set(
        budget.categoryIds ?? (budget.categoryId ? [budget.categoryId] : []),
      );

      const startIso = normalizeApiDate(budget.periodStart) || '';
      const endIso = normalizeApiDate(budget.periodEnd) || '';

      const spent = transactions.reduce((sum, item) => {
        // Check if transaction category is in budget's categories
        if (!categoryIdSet.has(item.categoryId)) {
          return sum;
        }

        // Check if transaction date is within budget period
        const itemDate = normalizeApiDate(item.date) || '';
        if (itemDate < startIso || itemDate > endIso) {
          return sum;
        }

        return sum + Number(item.amount || 0);
      }, 0);

      map.set(budget.budgetId, spent);
    });

    return map;
  }, [budgets, transactions]);

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

  useEffect(() => {
    setSelectedCategoryIds((current) =>
      current.filter((id) => budgetTypeCategories.some((item) => item.categoryId === id)),
    );
  }, [budgetTypeCategories]);

  const periodEnd = useMemo(() => getPeriodEndDate(periodStart, periodType), [periodStart, periodType]);

  const toggleCategoryId = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const createBudgetHandler = async () => {
    const amountLimit = parseMoneyInput(amountLimitInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề cho ngân sách.');
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
      await createBudget({
        // walletId intentionally omitted - budget applies to all wallets
        categoryId: selectedCategoryIds[0],
        categoryIds: selectedCategoryIds,
        title: titleInput.trim(),
        amountLimit,
        periodStart,
        periodEnd,
        periodType,
        alertThreshold: enableAlert ? parseInt(alertThresholdInput, 10) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowCreateModal(false);
      setAmountLimitInput('');
      setTitleInput('');
      setAmountLimitInput('');
      setAlertThresholdInput('80');
      setEnableAlert(true);
      setPeriodType('monthly');
      setPeriodStart(toIsoDate(new Date()));
      setSelectedCategoryIds([]);
      Alert.alert('Thành công', 'Đã tạo ngân sách mới.');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo ngân sách. Vui lòng thử lại.');
    }
  };

  const handleSmartBudgetConfirm = () => {
    setShowSmartBudgetDialog(false);
    router.push('/(tabs)/tools/budgets/smart-preview');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools" />
          <Text style={styles.title}>Ngân sách</Text>
          {expiredBudgets.length > 0 && (
            <Pressable
              style={[styles.showExpiredToggle, showExpired && styles.showExpiredToggleActive]}
              onPress={() => setShowExpired(!showExpired)}
            >
              <Ionicons
                name={showExpired ? 'eye' : 'eye-off-outline'}
                size={16}
                color={showExpired ? '#fff' : '#0f8c95'}
              />
              <Text style={[styles.showExpiredText, showExpired && styles.showExpiredTextActive]}>
                {expiredBudgets.length}
              </Text>
            </Pressable>
          )}
        </View>

        {budgetsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải ngân sách...</Text>
          </View>
        ) : filteredBudgets.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Chưa có ngân sách"
            description="Bạn có thể tạo ngân sách đầu tiên bằng nút bên dưới."
            action={{ title: "Tạo ngân sách", onPress: () => setShowCreationChoiceModal(true) }}
          />
        ) : (
          filteredBudgets.map((budget) => {
            const categoriesForBudget = (budget.categoryIds ?? (budget.categoryId ? [budget.categoryId] : []))
              .map((id) => categoryMap.get(id))
              .filter((item): item is NonNullable<typeof item> => Boolean(item));
            const visibleCategories = categoriesForBudget.slice(0, 3);
            const extraCategoryCount = Math.max(categoriesForBudget.length - visibleCategories.length, 0);
            const spent = budgetSpentAmounts.get(budget.budgetId) ?? 0;
            const percent = budget.amountLimit > 0 ? Math.min((spent / budget.amountLimit) * 100, 100) : 0;
            const title = budget.title?.trim() || 'Ngân sách';
            const isIncome = categoriesForBudget.length > 0 && categoriesForBudget[0]?.type === 'INCOME';
            const remainingAmount = Math.max(
              budget.amountLimit - spent,
              0,
            );
            const targetAmount = budget.amountLimit;
            const neededAmount = Math.max(targetAmount - spent, 0);

            const categoryName = visibleCategories[0]?.name || title;
            const categoryIcon = visibleCategories[0]?.icon || null;
            const categoryIdForColor = visibleCategories[0]?.categoryId || budget.budgetId;
            const startDateStr = formatDateVi(budget.periodStart);
            const endDateStr = formatDateVi(budget.periodEnd);

            return (
              <BudgetCard
                key={budget.budgetId}
                budgetId={budget.budgetId}
                categoryId={categoryIdForColor}
                categoryName={categoryName}
                categoryIcon={categoryIcon}
                targetAmount={targetAmount}
                spentAmount={spent}
                remainingAmount={remainingAmount}
                percent={percent}
                startDateStr={startDateStr}
                endDateStr={endDateStr}
                isIncome={isIncome}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/tools/budgets/[budgetId]/edit',
                    params: { budgetId: budget.budgetId },
                  })
                }
              />
            );
          })
        )}
      </ScrollView>

      <View style={styles.fabRow}>
        <FAB
          label="Thêm ngân sách"
          onPress={() => setShowCreationChoiceModal(true)}
        />
      </View>

      {/* Smart Budget Dialog */}
      <SmartBudgetDialog
        visible={showSmartBudgetDialog}
        onDismiss={() => setShowSmartBudgetDialog(false)}
        onConfirm={handleSmartBudgetConfirm}
      />

      {/* Creation Choice Modal */}
      <Modal visible={showCreationChoiceModal} transparent animationType="slide" onRequestClose={() => setShowCreationChoiceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreationChoiceModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm ngân sách</Text>
              <Pressable onPress={() => setShowCreationChoiceModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <View style={{ gap: 12, marginTop: 10, paddingBottom: 16 }}>
              <Pressable
                style={styles.choiceCard}
                onPress={() => {
                  setShowCreationChoiceModal(false);
                  setShowSmartBudgetDialog(true);
                }}
              >
                <View style={[styles.choiceIcon, { backgroundColor: '#e9fbfd' }]}>
                  <Ionicons name="flash" size={24} color="#0f8c95" />
                </View>
                <View style={styles.choiceInfo}>
                  <Text style={styles.choiceTitle}>Tự động</Text>
                  <Text style={styles.choiceDesc}>Tạo ngân sách tự động cực nhanh và thông minh.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>

              <Pressable
                style={styles.choiceCard}
                onPress={() => {
                  setShowCreationChoiceModal(false);
                  setShowCreateModal(true);
                }}
              >
                <View style={[styles.choiceIcon, { backgroundColor: '#f3f4f6' }]}>
                  <Ionicons name="create-outline" size={24} color="#4b5563" />
                </View>
                <View style={styles.choiceInfo}>
                  <Text style={styles.choiceTitle}>Thủ công</Text>
                  <Text style={styles.choiceDesc}>Tự do tùy chỉnh hạng mục và hạn mức.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {budgetType === 'EXPENSE' ? 'Tạo ngân sách' : 'Tạo mục tiêu'}
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

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
              <Pressable
                style={styles.dropdownInput}
                onPress={() => setShowPeriodDropdown((current) => !current)}
              >
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

            <View style={styles.alertThresholdSection}>
              <View style={styles.alertThresholdHeader}>
                <View style={styles.alertThresholdTitleRow}>
                  <Ionicons name="notifications-outline" size={20} color="#5d6972" />
                  <Text style={styles.sectionLabel}>Cảnh báo khi vượt mức (%)</Text>
                </View>
                <View style={styles.switchWrapper}>
                  <View style={[styles.switch, enableAlert && styles.switchActive]} onTouchEnd={() => setEnableAlert(!enableAlert)}>
                    <View style={[styles.switchThumb, enableAlert && styles.switchThumbActive]} />
                  </View>
                </View>
              </View>
              {enableAlert && (
                <View style={styles.alertThresholdControl}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    keyboardType="numeric"
                    value={alertThresholdInput}
                    onChangeText={(val) => {
                       const num = parseInt(val, 10);
                       if (!val) setAlertThresholdInput('');
                       else if (!isNaN(num) && num >= 1 && num <= 100) setAlertThresholdInput(num.toString());
                    }}
                    placeholder="VD: 80"
                  />
                  <View style={styles.alertPercentBadge}>
                    <Text style={styles.alertPercentText}>%</Text>
                  </View>
                </View>
              )}
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
                    <CategoryIcon icon={item.icon} color={(item as any).color || '#0f8c95'} size={16} />
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

            <Text style={styles.walletNote}>
              💡 Ngân sách này sẽ áp dụng cho tất cả ví REGULAR của bạn
            </Text>

            <Button title="Lưu" onPress={createBudgetHandler} />
          </View>
        </View>
      </Modal>

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
              <Button title="Hủy" variant="ghost" onPress={() => setShowCalendarModal(false)} />
              <Button title="OK" onPress={applyCalendarSelection} />
            </View>
          </View>
        </View>
      </Modal>

      <CategoryPickerModal
        visible={showCategoryPickerModal}
        onClose={() => setShowCategoryPickerModal(false)}
        selectedCategoryIds={selectedCategoryIds}
        multiSelect={true}
        allowedTypes={[budgetType]}
        initialType={budgetType}
        onSelectCategory={(category) => toggleCategoryId(category.categoryId)}
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
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  smartHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e9fbfd',
    borderWidth: 1,
    borderColor: '#29bcc8',
  },
  smartHeaderButtonText: {
    color: '#0f8c95',
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
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
  typeToggleTopRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
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
  walletNote: {
    fontSize: 13,
    color: '#6B7280',
    backgroundColor: '#f3fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  switchWrapper: {
    marginLeft: 8,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d5dde3',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#29bcc8',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  alertThresholdSection: {
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e6ecef',
  },
  alertThresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertThresholdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertThresholdControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  alertPercentBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e9fbfd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertPercentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f8c95',
  },
  fabRow: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  smartFab: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#e9fbfd',
    borderWidth: 1,
    borderColor: '#29bcc8',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 5,
  },
  smartFabText: {
    color: '#0f8c95',
    fontSize: 14,
    fontWeight: '700',
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
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceInfo: {
    flex: 1,
    gap: 4,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  choiceDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Show expired toggle
  showExpiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9fbfd',
    borderWidth: 1,
    borderColor: '#29bcc8',
  },
  showExpiredToggleActive: {
    backgroundColor: '#0f8c95',
    borderColor: '#0f8c95',
  },
  showExpiredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f8c95',
  },
  showExpiredTextActive: {
    color: '#fff',
  },
});
