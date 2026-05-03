import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
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

import { Category } from '@/modules/category/models/category.types';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { Wallet } from '@/modules/wallet/models/wallet.types';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import {
  Transaction,
  TransactionCreateInput,
  TransactionFilters,
} from '@/modules/transaction/models/transaction.types';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { formatMoneyInput, parseMoneyInput, formatVndAmount } from '@/shared/utils/money';

type CategoryType = 'EXPENSE' | 'INCOME';

type TimeMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL' | 'CUSTOM';
type CalendarTarget = 'day' | 'customStart' | 'customEnd' | 'formDate';

const defaultCategoryTemplates: Array<{
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}> = [
    { name: 'Chưa được phân loại', type: 'EXPENSE', icon: '❓', color: '#BFEFF3' },
    { name: 'Thực phẩm', type: 'EXPENSE', icon: '🛒', color: '#BFEFF3' },
    { name: 'Thú cưng', type: 'EXPENSE', icon: '🐾', color: '#BFEFF3' },
    { name: 'Làm đẹp', type: 'EXPENSE', icon: '💄', color: '#BFEFF3' },
    { name: 'Điện tử', type: 'EXPENSE', icon: '📱', color: '#BFEFF3' },
    { name: 'Giáo dục', type: 'EXPENSE', icon: '🎓', color: '#BFEFF3' },
    { name: 'Thể thao', type: 'EXPENSE', icon: '⚽', color: '#BFEFF3' },
    { name: 'Sức khỏe', type: 'EXPENSE', icon: '💊', color: '#BFEFF3' },
    { name: 'Du lịch', type: 'EXPENSE', icon: '✈️', color: '#BFEFF3' },
    { name: 'Giải trí', type: 'EXPENSE', icon: '🎮', color: '#BFEFF3' },
    { name: 'Lương', type: 'INCOME', icon: '💼', color: '#BFEFF3' },
    { name: 'Thưởng', type: 'INCOME', icon: '🎁', color: '#BFEFF3' },
    { name: 'Đầu tư', type: 'INCOME', icon: '📈', color: '#BFEFF3' },
    { name: 'Khác', type: 'INCOME', icon: '💰', color: '#BFEFF3' },
  ];

const categoryIconOptions: Array<{ label: string; icon: string }> = [
  { label: 'Giỏ hàng', icon: '🛒' },
  { label: 'Đồ ăn', icon: '🍜' },
  { label: 'Cà phê', icon: '☕' },
  { label: 'Nhà', icon: '🏠' },
  { label: 'Hóa đơn', icon: '🧾' },
  { label: 'Dọn dẹp', icon: '🧹' },
  { label: 'Điện thoại', icon: '📱' },
  { label: 'Laptop', icon: '💻' },
  { label: 'Giáo dục', icon: '🎓' },
  { label: 'Sức khỏe', icon: '💊' },
  { label: 'Thú cưng', icon: '🐾' },
  { label: 'Du lịch', icon: '✈️' },
  { label: 'Thể thao', icon: '⚽' },
  { label: 'Giải trí', icon: '🎮' },
  { label: 'Làm đẹp', icon: '💄' },
  { label: 'Tiền mặt', icon: '💵' },
  { label: 'Tiết kiệm', icon: '🏦' },
  { label: 'Đầu tư', icon: '📈' },
  { label: 'Quà tặng', icon: '🎁' },
  { label: 'Lương', icon: '💼' },
  { label: 'Ý tưởng', icon: '💡' },
  { label: 'Xe cộ', icon: '🚗' },
  { label: 'Tài liệu', icon: '📄' },
  { label: 'Ăn uống', icon: '🍱' },
];

const defaultCategoryIconByType: Record<CategoryType, string> = {
  EXPENSE: '🧾',
  INCOME: '💰',
};

const timeModeLabel: Record<TimeMode, string> = {
  DAY: 'Ngày',
  WEEK: 'Tuần',
  MONTH: 'Tháng',
  YEAR: 'Năm',
  ALL: 'Mọi thời gian',
  CUSTOM: 'Phạm vi tùy chỉnh',
};

const formatIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const weekdayDisplay = (value: Date) => (value.getDay() === 0 ? 'CN' : `Th ${value.getDay() + 1}`);

const formatDateShort = (value: Date) => `${value.getDate()} thg ${value.getMonth() + 1}`;

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

const startOfWeek = (value: Date) => {
  const cloned = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const day = cloned.getDay();
  const diff = (day + 6) % 7;
  cloned.setDate(cloned.getDate() - diff);
  return cloned;
};

const endOfWeek = (value: Date) => {
  const start = startOfWeek(value);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  end.setDate(start.getDate() + 6);
  return end;
};

const getTimeRange = (
  mode: TimeMode,
  selectedDate: Date,
  customStartDate: string,
  customEndDate: string,
) => {
  if (mode === 'ALL') {
    return {};
  }

  if (mode === 'DAY') {
    const day = formatIsoDate(selectedDate);
    return { fromDate: day, toDate: day };
  }

  if (mode === 'WEEK') {
    return {
      fromDate: formatIsoDate(startOfWeek(selectedDate)),
      toDate: formatIsoDate(endOfWeek(selectedDate)),
    };
  }

  if (mode === 'MONTH') {
    return toMonthRange(selectedDate);
  }

  if (mode === 'YEAR') {
    const year = selectedDate.getFullYear();
    return {
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
    };
  }

  const parsedStart = parseIsoDate(customStartDate);
  const parsedEnd = parseIsoDate(customEndDate);
  if (!parsedStart || !parsedEnd) {
    return {};
  }

  return {
    fromDate: formatIsoDate(parsedStart),
    toDate: formatIsoDate(parsedEnd),
  };
};

const getTimeDisplayLabel = (
  mode: TimeMode,
  selectedDate: Date,
  customStartDate: string,
  customEndDate: string,
) => {
  if (mode === 'DAY') {
    return `${weekdayDisplay(selectedDate)}, ${formatDateShort(selectedDate)}`;
  }

  if (mode === 'WEEK') {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return `${formatDateShort(start)} - ${formatDateShort(end)}`;
  }

  if (mode === 'MONTH') {
    return monthLabel(selectedDate);
  }

  if (mode === 'YEAR') {
    return `${selectedDate.getFullYear()}`;
  }

  if (mode === 'ALL') {
    return 'Mọi thời gian';
  }

  const parsedStart = parseIsoDate(customStartDate);
  const parsedEnd = parseIsoDate(customEndDate);
  if (!parsedStart || !parsedEnd) {
    return 'Chọn phạm vi';
  }
  return `${formatDateShort(parsedStart)} - ${formatDateShort(parsedEnd)}`;
};

const toMonthRange = (month: Date) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  return { fromDate: formatIsoDate(start), toDate: formatIsoDate(end) };
};

const monthLabel = (month: Date) => `tháng ${month.getMonth() + 1} năm ${month.getFullYear()}`;

const formatDayLabel = (value: Date) => `${weekdayDisplay(value)}, ${formatDateShort(value)}`;

const formatMonthShort = (value: Date) => `thg ${value.getMonth() + 1}`;

const createWeekOptions = (anchor: Date) => {
  const base = startOfWeek(anchor);
  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (index - 3) * 7);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return {
      start,
      end,
      key: `${formatIsoDate(start)}_${formatIsoDate(end)}`,
      label: `${start.getDate()} ${formatMonthShort(start)} - ${end.getDate()} ${formatMonthShort(end)}`,
    };
  });
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

export const TransactionScreen = () => {
  const queryClient = useQueryClient();
  const { getWallets } = useWalletUsecases();
  const { getCategories, createCategory } = useCategoryUsecases();
  const { getTransactions, createTransaction, updateTransaction } = useTransactionUsecases();
  const seededDefaultCategoriesRef = useRef(false);
  const seedingInProgressRef = useRef(false);
  const openCreateRef = useRef(false);
  const params = useLocalSearchParams<{ walletId?: string; openCreate?: string }>();

  const normalizeCategoryType = (value: unknown): CategoryType =>
    String(value || '').toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeMode, setTimeMode] = useState<TimeMode>('MONTH');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRangePickerModal, setShowRangePickerModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget>('day');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(formatIsoDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(formatIsoDate(new Date()));
  const [tempCustomStartDate, setTempCustomStartDate] = useState(formatIsoDate(new Date()));
  const [tempCustomEndDate, setTempCustomEndDate] = useState(formatIsoDate(new Date()));
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(formatIsoDate(new Date()));
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'create' | 'edit'>('create');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [showCreateCategoryComposer, setShowCreateCategoryComposer] = useState(false);
  const [showIconOptions, setShowIconOptions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [aiInputText, setAiInputText] = useState('');

  const [formCategoryId, setFormCategoryId] = useState('');
  const [formCategoryType, setFormCategoryType] = useState<CategoryType>('EXPENSE');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(defaultCategoryIconByType.EXPENSE);
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(formatIsoDate(new Date()));

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const createModalCategories = useMemo(
    () => categories.filter((item) => normalizeCategoryType(item.type) === formCategoryType),
    [categories, formCategoryType],
  );

  const lastParamWalletIdRef = useRef(params.walletId);

  useEffect(() => {
    if (
      params.walletId &&
      params.walletId !== lastParamWalletIdRef.current &&
      wallets.some((wallet) => wallet.walletId === params.walletId)
    ) {
      setSelectedWalletId(params.walletId as string);
      lastParamWalletIdRef.current = params.walletId;
      return;
    }
    if (!selectedWalletId && wallets.length > 0) {
      if (params.walletId && wallets.some((wallet) => wallet.walletId === params.walletId)) {
        setSelectedWalletId(params.walletId as string);
        lastParamWalletIdRef.current = params.walletId;
      } else {
        setSelectedWalletId(wallets[0].walletId);
      }
    }
  }, [wallets, selectedWalletId, params.walletId]);

  useEffect(() => {
    if (!categoriesQuery.isSuccess || seededDefaultCategoriesRef.current || seedingInProgressRef.current) {
      return;
    }

    seedingInProgressRef.current = true;

    const existingKeys = new Set(
      categories.map((item) => `${normalizeCategoryType(item.type)}::${item.name.trim().toLowerCase()}`),
    );

    const missing = defaultCategoryTemplates.filter((item) => {
      const key = `${item.type}::${item.name.trim().toLowerCase()}`;
      return !existingKeys.has(key);
    });

    if (missing.length === 0) {
      seededDefaultCategoriesRef.current = true;
      seedingInProgressRef.current = false;
      return;
    }

    (async () => {
      try {
        for (const item of missing) {
          await createCategory({
            name: item.name,
            type: item.type,
            icon: item.icon,
            color: item.color,
          });
        }
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        seededDefaultCategoriesRef.current = true;
      } catch {
        seededDefaultCategoriesRef.current = false;
      } finally {
        seedingInProgressRef.current = false;
      }
    })();
  }, [categories, categoriesQuery.isSuccess, createCategory, queryClient]);

  const currentWallet = wallets.find((wallet) => wallet.walletId === selectedWalletId) ?? null;

  const transactionFilters: TransactionFilters | undefined = useMemo(() => {
    if (!selectedWalletId) {
      return undefined;
    }

    const range = getTimeRange(timeMode, selectedDate, customStartDate, customEndDate);

    return {
      walletId: selectedWalletId,
      fromDate: range.fromDate,
      toDate: range.toDate,
      page: 0,
      size: 100,
      sort: 'date,desc',
    };
  }, [selectedWalletId, timeMode, selectedDate, customStartDate, customEndDate]);

  const transactionsQuery = useQuery({
    queryKey: ['transactions', transactionFilters],
    queryFn: () => getTransactions(transactionFilters),
    enabled: Boolean(transactionFilters?.walletId),
  });

  const transactions = transactionsQuery.data ?? [];

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.categoryId, category])),
    [categories],
  );

  const summary = useMemo(() => {
    let expense = 0;
    let income = 0;

    transactions.forEach((item) => {
      const category = categoryMap.get(item.categoryId);
      if (normalizeCategoryType(category?.type) === 'INCOME') {
        income += item.amount;
      } else {
        expense += item.amount;
      }
    });

    return {
      expense,
      income,
      net: income - expense,
    };
  }, [transactions, categoryMap]);

  const groupedByDate = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    transactions.forEach((item) => {
      const key = item.date;
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    });
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const shiftTimeRange = (direction: -1 | 1) => {
    if (timeMode === 'ALL' || timeMode === 'CUSTOM') {
      return;
    }

    if (timeMode === 'DAY') {
      setSelectedDate((current) => {
        const next = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        next.setDate(next.getDate() + direction);
        return next;
      });
      return;
    }

    if (timeMode === 'WEEK') {
      setSelectedDate((current) => {
        const next = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        next.setDate(next.getDate() + 7 * direction);
        return next;
      });
      return;
    }

    if (timeMode === 'MONTH') {
      setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
      return;
    }

    setSelectedDate((current) => new Date(current.getFullYear() + direction, 0, 1));
  };

  const selectTimeMode = (mode: TimeMode) => {
    setTimeMode(mode);
    if (mode === 'CUSTOM') {
      const today = formatIsoDate(new Date());
      if (!customStartDate) {
        setCustomStartDate(today);
      }
      if (!customEndDate) {
        setCustomEndDate(today);
      }
    }
    setShowTimeModal(false);
  };

  const openRangePicker = () => {
    setTempCustomStartDate(customStartDate);
    setTempCustomEndDate(customEndDate);
    setTempYear(selectedDate.getFullYear());
    setTempMonth(selectedDate.getMonth());
    setTempDay(formatIsoDate(selectedDate));
    setShowRangePickerModal(true);
  };

  const applyDaySelection = () => {
    const parsed = parseIsoDate(tempDay);
    if (!parsed) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập đúng định dạng YYYY-MM-DD.');
      return;
    }
    setSelectedDate(parsed);
    setShowRangePickerModal(false);
  };

  const applyMonthSelection = () => {
    setSelectedDate(new Date(tempYear, tempMonth, 1));
    setShowRangePickerModal(false);
  };

  const applyYearSelection = (year: number) => {
    setSelectedDate(new Date(year, 0, 1));
    setShowRangePickerModal(false);
  };

  const applyCustomSelection = () => {
    const parsedStart = parseIsoDate(tempCustomStartDate);
    const parsedEnd = parseIsoDate(tempCustomEndDate);
    if (!parsedStart || !parsedEnd) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập đúng định dạng YYYY-MM-DD.');
      return;
    }
    if (parsedStart > parsedEnd) {
      Alert.alert('Khoảng ngày không hợp lệ', 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
      return;
    }

    setCustomStartDate(tempCustomStartDate);
    setCustomEndDate(tempCustomEndDate);
    setShowRangePickerModal(false);
  };

  const changeFormCategoryType = (nextType: CategoryType) => {
    setFormCategoryType(nextType);
    setNewCategoryIcon(defaultCategoryIconByType[nextType]);
    setShowIconOptions(false);
    const current = categories.find((item) => item.categoryId === formCategoryId);
    if (current && normalizeCategoryType(current.type) !== nextType) {
      setFormCategoryId('');
    }
  };

  const openCreateCategoryComposer = () => {
    setNewCategoryName('');
    setNewCategoryIcon(defaultCategoryIconByType[formCategoryType]);
    setShowIconOptions(false);
    setShowCreateCategoryComposer(true);
  };

  const closeCreateCategoryComposer = () => {
    setShowCreateCategoryComposer(false);
    setShowIconOptions(false);
  };

  const submitCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      const created = await createCategory({
        name: trimmedName,
        type: formCategoryType,
        icon: newCategoryIcon,
        color: '#BFEFF3',
      });
      setNewCategoryName('');
      setNewCategoryIcon(defaultCategoryIconByType[formCategoryType]);
      setShowIconOptions(false);
      setShowCreateCategoryComposer(false);
      setFormCategoryId(created.categoryId);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo danh mục. Vui lòng thử lại.');
    }
  };

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
      setTempDay(value);
    }
    if (calendarTarget === 'customStart') {
      setTempCustomStartDate(value);
    }
    if (calendarTarget === 'customEnd') {
      setTempCustomEndDate(value);
    }
    if (calendarTarget === 'formDate') {
      setFormDate(value);
    }
    setShowCalendarModal(false);
  };

  const calendarCells = useMemo(() => buildCalendarMatrix(calendarMonth), [calendarMonth]);

  const openCreateTransactionModal = () => {
    setTransactionModalMode('create');
    setEditingTransactionId(null);
    setFormCategoryType('EXPENSE');
    setFormCategoryId('');
    setFormAmount('');
    setFormNote('');
    setFormDate(formatIsoDate(new Date()));
    setShowTransactionModal(true);
  };

  useEffect(() => {
    if (params.openCreate !== '1' || openCreateRef.current) {
      return;
    }
    if (wallets.length === 0) {
      return;
    }
    if (params.walletId && wallets.some((wallet) => wallet.walletId === params.walletId)) {
      setSelectedWalletId(params.walletId);
    }
    openCreateTransactionModal();
    openCreateRef.current = true;
  }, [params.openCreate, params.walletId, wallets, openCreateTransactionModal]);

  const openEditTransactionModal = (item: Transaction) => {
    const category = categories.find((entry) => entry.categoryId === item.categoryId);
    setTransactionModalMode('edit');
    setEditingTransactionId(item.transactionId);
    setFormCategoryType(normalizeCategoryType(category?.type));
    setFormCategoryId(item.categoryId);
    setFormAmount(formatMoneyInput(item.amount));
    setFormNote(item.note || '');
    setFormDate(item.date);
    setShowTransactionModal(true);
  };

  const submitTransactionForm = async () => {
    if (!selectedWalletId) {
      Alert.alert('Thiếu ví', 'Vui lòng chọn ví trước khi tạo giao dịch.');
      return;
    }
    if (!currentWallet) {
      Alert.alert('Thiếu ví', 'Không tìm thấy thông tin ví hiện tại.');
      return;
    }
    if (!formCategoryId) {
      Alert.alert('Thiếu danh mục', 'Vui lòng chọn danh mục.');
      return;
    }
    const amountNumber = parseMoneyInput(formAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    const selectedCategoryType = normalizeCategoryType(
      categories.find((item) => item.categoryId === formCategoryId)?.type,
    );
    const signedAmount = selectedCategoryType === 'INCOME' ? amountNumber : -amountNumber;

    const isDebtWallet = String(currentWallet.type || '').toUpperCase() === 'DEBT';
    if (!isDebtWallet) {
      let projectedBalance = (currentWallet.currentBalance ?? 0) + signedAmount;

      if (transactionModalMode === 'edit' && editingTransactionId) {
        const original = transactions.find((item) => item.transactionId === editingTransactionId);
        if (original) {
          const originalCategoryType = normalizeCategoryType(categoryMap.get(original.categoryId)?.type);
          const originalSignedAmount = originalCategoryType === 'INCOME' ? original.amount : -original.amount;
          projectedBalance = (currentWallet.currentBalance ?? 0) - originalSignedAmount + signedAmount;
        }
      }

      if (projectedBalance < 0) {
        Alert.alert(
          'Không đủ số dư',
          `Giao dịch này sẽ làm ví âm ${formatVndAmount(Math.abs(projectedBalance))}. Vui lòng giảm số tiền hoặc chọn ví khác.`,
        );
        return;
      }
    }

    try {
      if (transactionModalMode === 'edit') {
        if (!editingTransactionId) {
          Alert.alert('Lỗi', 'Không xác định được giao dịch cần chỉnh sửa.');
          return;
        }
        await updateTransaction(editingTransactionId, {
          categoryId: formCategoryId,
          amount: amountNumber,
          note: formNote.trim() || null,
          date: formDate,
        });
      } else {
        const payload: TransactionCreateInput = {
          walletId: selectedWalletId,
          categoryId: formCategoryId,
          amount: amountNumber,
          note: formNote.trim() || null,
          date: formDate,
        };
        await createTransaction(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setFormAmount('');
      setFormNote('');
      setFormDate(formatIsoDate(new Date()));
      setEditingTransactionId(null);
      setShowTransactionModal(false);
      Alert.alert('Thành công', transactionModalMode === 'edit' ? 'Đã cập nhật giao dịch.' : 'Đã tạo giao dịch mới.');
    } catch {
      Alert.alert('Lỗi', transactionModalMode === 'edit' ? 'Không thể cập nhật giao dịch.' : 'Không thể tạo giao dịch.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Giao dịch</Text>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => setShowSearchModal(true)}>
              <Ionicons name="search" size={24} color="#1f1f1f" />
            </Pressable>
            <Ionicons name="calendar" size={22} color="#1f1f1f" />
            <Pressable onPress={() => setShowAIChatModal(true)}>
              <Ionicons name="sparkles" size={22} color="#1f1f1f" />
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletChipRow}>
          {wallets.map((wallet) => (
            <Pressable
              key={wallet.walletId}
              onPress={() => setSelectedWalletId(wallet.walletId)}
              style={[styles.walletChip, selectedWalletId === wallet.walletId ? styles.walletChipActive : null]}
            >
              <MaterialIcons name="account-balance-wallet" size={16} color="#23b8c2" />
              <Text style={styles.walletChipText}>{wallet.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.monthFilterRow}>
          <Pressable style={styles.filterBox} onPress={() => setShowTimeModal(true)}>
            <Text style={styles.filterBoxText}>{timeModeLabel[timeMode]}</Text>
            <Ionicons name="calendar" size={18} color="#1f1f1f" />
            <Ionicons name="chevron-down" size={18} color="#1f1f1f" />
          </Pressable>
        </View>

        <Pressable style={styles.monthNavigator} onPress={openRangePicker}>
          <Text style={styles.monthText} numberOfLines={1}>
            {getTimeDisplayLabel(timeMode, selectedDate, customStartDate, customEndDate)}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#555" />
        </Pressable>

        <View style={styles.summaryBar}>
          <Text style={styles.expenseText}>▼ {formatVndAmount(summary.expense)}</Text>
          <Text style={styles.incomeText}>▲ {formatVndAmount(summary.income)}</Text>
          <Text style={styles.netText}>= {formatVndAmount(summary.net)}</Text>
        </View>

        {transactionsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải giao dịch...</Text>
          </View>
        ) : groupedByDate.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có giao dịch trong tháng này.</Text>
          </View>
        ) : (
          groupedByDate.map(([date, items]) => (
            <View key={date} style={styles.groupWrap}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupDate}>{date}</Text>
                <Text style={styles.groupTotal}>
                  {formatVndAmount(
                    items.reduce((sum, item) => {
                      const category = categoryMap.get(item.categoryId);
                      return sum + (normalizeCategoryType(category?.type) === 'INCOME' ? item.amount : -item.amount);
                    }, 0),
                  )}
                </Text>
              </View>

              {items.map((item) => {
                const category: Category | undefined = categoryMap.get(item.categoryId);
                const isIncome = normalizeCategoryType(category?.type) === 'INCOME';

                return (
                  <Pressable key={item.transactionId} style={styles.transactionCard} onPress={() => openEditTransactionModal(item)}>
                    <View style={styles.transactionIconWrap}>
                      <Text style={styles.transactionIconText}>{category?.icon || (isIncome ? '💰' : '🛒')}</Text>
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{category?.name ?? 'Danh mục'}</Text>
                      <Text style={styles.transactionNote}>{item.note || 'Không có ghi chú'}</Text>
                    </View>

                    <Text style={[styles.transactionAmount, isIncome ? styles.transactionIncome : styles.transactionExpense]}>
                      {isIncome ? '▲ ' : '▼ '}
                      {formatVndAmount(item.amount)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openCreateTransactionModal}>
        <Ionicons name="add" size={36} color="#fff" />
      </Pressable>

      <Modal
        visible={showTransactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {transactionModalMode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch'}
              </Text>
              <Pressable onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Ví</Text>
            <TextInput
              value={currentWallet?.name ?? ''}
              editable={false}
              style={[styles.input, styles.inputDisabled]}
            />

            <Text style={styles.modalLabel}>Loại</Text>
            <Pressable
              style={styles.categoryPickerInput}
              onPress={() => {
                closeCreateCategoryComposer();
                setShowCategoryPickerModal(true);
              }}
            >
              <View style={styles.categoryPickerValueWrap}>
                <View style={styles.categoryPickerIconWrap}>
                  <Text style={styles.categoryPickerIconText}>
                    {categories.find((item) => item.categoryId === formCategoryId)?.icon || '❓'}
                  </Text>
                </View>
                <Text style={styles.categoryPickerValueText}>
                  {categories.find((item) => item.categoryId === formCategoryId)?.name || 'Chọn danh mục'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#555" />
            </Pressable>

            <Text style={styles.modalLabel}>Số tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 10.000"
              keyboardType="numeric"
              value={formAmount}
              onChangeText={(text) => setFormAmount(formatMoneyInput(text))}
            />

            <Text style={styles.modalLabel}>Ngày</Text>
            <Pressable
              style={styles.calendarInput}
              onPress={() => openCalendarPicker('formDate', formDate)}
            >
              <Ionicons name="calendar" size={18} color="#29bcc8" />
              <Text style={styles.calendarInputText}>{formDate}</Text>
            </Pressable>

            <Text style={styles.modalLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Ghi chú"
              value={formNote}
              onChangeText={setFormNote}
              multiline
            />

            <Pressable style={styles.submitBtn} onPress={submitTransactionForm}>
              <Text style={styles.submitBtnText}>
                {transactionModalMode === 'edit' ? 'Lưu thay đổi' : 'Lưu giao dịch'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCategoryPickerModal(false);
          closeCreateCategoryComposer();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryPickerSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <Pressable
                onPress={() => {
                  setShowCategoryPickerModal(false);
                  closeCreateCategoryComposer();
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.categoryPickerHint}>
              Chọn danh mục mặc định bên dưới hoặc thêm danh mục mới.
            </Text>

            <View style={styles.typeToggleRow}>
              <Pressable
                style={[styles.typeToggleBtn, formCategoryType === 'EXPENSE' ? styles.typeToggleBtnActive : null]}
                onPress={() => changeFormCategoryType('EXPENSE')}
              >
                <Text
                  style={[
                    styles.typeToggleBtnText,
                    formCategoryType === 'EXPENSE' ? styles.typeToggleBtnTextActive : null,
                  ]}
                >
                  Chi phí
                </Text>
              </Pressable>

              <Pressable
                style={[styles.typeToggleBtn, formCategoryType === 'INCOME' ? styles.typeToggleBtnActive : null]}
                onPress={() => changeFormCategoryType('INCOME')}
              >
                <Text
                  style={[
                    styles.typeToggleBtnText,
                    formCategoryType === 'INCOME' ? styles.typeToggleBtnTextActive : null,
                  ]}
                >
                  Thu nhập
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.categoryPickerScroll} contentContainerStyle={styles.categoryPickerContent}>
              {createModalCategories.length === 0 ? (
                <View style={styles.emptyCategoryBox}>
                  <Text style={styles.emptyText}>Chưa có danh mục cho loại này.</Text>
                </View>
              ) : (
                <View style={styles.categoryGrid}>
                  {createModalCategories.map((category) => {
                    const selected = formCategoryId === category.categoryId;
                    return (
                      <Pressable
                        key={category.categoryId}
                        onPress={() => {
                          setFormCategoryId(category.categoryId);
                          setShowCategoryPickerModal(false);
                          closeCreateCategoryComposer();
                        }}
                        style={[styles.categoryGridItem, selected ? styles.categoryGridItemSelected : null]}
                      >
                        <View style={styles.categoryGridIconWrap}>
                          <Text style={styles.categoryGridIconText}>{category.icon || '❓'}</Text>
                        </View>
                        <Text style={styles.categoryGridLabel} numberOfLines={2}>
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {showCreateCategoryComposer ? (
                <View style={styles.addCategoryRow}>
                  <TextInput
                    style={[styles.input, styles.addCategoryInput]}
                    placeholder="Tên danh mục mới"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />

                  <Pressable style={styles.pickIconButton} onPress={() => setShowIconOptions((prev) => !prev)}>
                    <View style={styles.pickIconValueWrap}>
                      <View style={styles.pickIconCircle}>
                        <Text style={styles.pickIconText}>{newCategoryIcon}</Text>
                      </View>
                      <Text style={styles.pickIconLabel}>Chọn icon</Text>
                    </View>
                    <Ionicons name={showIconOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#4a5963" />
                  </Pressable>

                  {showIconOptions ? (
                    <View style={styles.iconGrid}>
                      {categoryIconOptions.map((option) => {
                        const selected = newCategoryIcon === option.icon;
                        return (
                          <Pressable
                            key={option.icon}
                            onPress={() => setNewCategoryIcon(option.icon)}
                            style={[styles.iconGridItem, selected ? styles.iconGridItemSelected : null]}
                          >
                            <View style={[styles.iconGridCircle, selected ? styles.iconGridCircleSelected : null]}>
                              <Text style={styles.iconGridText}>{option.icon}</Text>
                            </View>
                            <Text style={styles.iconGridName} numberOfLines={1}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  <View style={styles.addCategoryActionRow}>
                    <Pressable style={styles.addCategoryGhostButton} onPress={closeCreateCategoryComposer}>
                      <Text style={styles.addCategoryGhostButtonText}>Hủy</Text>
                    </Pressable>
                    <Pressable style={styles.addCategoryButton} onPress={submitCreateCategory}>
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.addCategoryButtonText}>Lưu danh mục</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.openAddCategoryButton} onPress={openCreateCategoryComposer}>
                  <Ionicons name="add-circle-outline" size={18} color="#179ea9" />
                  <Text style={styles.openAddCategoryButtonText}>Thêm danh mục</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showTimeModal} transparent animationType="fade" onRequestClose={() => setShowTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.timeSheet}>
            <View style={styles.timeHandle} />
            <Text style={styles.timeSheetTitle}>Chọn khoảng thời gian</Text>

            <View style={styles.timeGrid}>
              <TimeModeButton
                label="Ngày"
                icon="calendar"
                active={timeMode === 'DAY'}
                onPress={() => selectTimeMode('DAY')}
              />
              <TimeModeButton
                label="Tuần"
                icon="calendar"
                active={timeMode === 'WEEK'}
                onPress={() => selectTimeMode('WEEK')}
              />
              <TimeModeButton
                label="Tháng"
                icon="calendar"
                active={timeMode === 'MONTH'}
                onPress={() => selectTimeMode('MONTH')}
              />
              <TimeModeButton
                label="Năm"
                icon="calendar-outline"
                active={timeMode === 'YEAR'}
                onPress={() => selectTimeMode('YEAR')}
              />
              <TimeModeButton
                label="Mọi thời gian"
                icon="infinite"
                active={timeMode === 'ALL'}
                onPress={() => selectTimeMode('ALL')}
              />
              <TimeModeButton
                label="Phạm vi tùy chỉnh"
                icon="create-outline"
                active={timeMode === 'CUSTOM'}
                onPress={() => selectTimeMode('CUSTOM')}
              />
            </View>

            <Pressable onPress={() => setShowTimeModal(false)} style={styles.cancelTimeBtn}>
              <Text style={styles.cancelTimeBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRangePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRangePickerModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.rangePickerCard}>
            {timeMode === 'DAY' ? (
              <>
                <Text style={styles.rangePickerTitle}>Chọn ngày</Text>
                <View style={styles.rangeRowInline}>
                  <Pressable onPress={() => shiftTimeRange(-1)} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-back" size={18} color="#555" />
                  </Pressable>
                  <Text style={styles.rangeCurrentValue}>{formatDayLabel(selectedDate)}</Text>
                  <Pressable onPress={() => shiftTimeRange(1)} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  </Pressable>
                </View>
                <Pressable style={styles.calendarInput} onPress={() => openCalendarPicker('day', tempDay)}>
                  <Ionicons name="calendar" size={18} color="#29bcc8" />
                  <Text style={styles.calendarInputText}>{tempDay}</Text>
                  <Ionicons name="chevron-down" size={18} color="#555" />
                </Pressable>
                <View style={styles.rangeActionRow}>
                  <Pressable style={styles.rangeGhostBtn} onPress={() => setShowRangePickerModal(false)}>
                    <Text style={styles.rangeGhostBtnText}>Hủy</Text>
                  </Pressable>
                  <Pressable style={styles.rangeConfirmBtn} onPress={applyDaySelection}>
                    <Text style={styles.rangeConfirmBtnText}>OK</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {timeMode === 'WEEK' ? (
              <>
                <Text style={styles.rangePickerTitle}>Tuần</Text>
                <ScrollView style={styles.weekList} contentContainerStyle={styles.weekListContent}>
                  {createWeekOptions(selectedDate).map((option) => {
                    const selected =
                      formatIsoDate(startOfWeek(selectedDate)) === formatIsoDate(option.start);

                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => {
                          setSelectedDate(option.start);
                          setShowRangePickerModal(false);
                        }}
                        style={[styles.weekOption, selected ? styles.weekOptionActive : null]}
                      >
                        <Text style={[styles.weekOptionLabel, selected ? styles.weekOptionLabelActive : null]}>
                          {option.label}
                        </Text>
                        <Text style={[styles.weekOptionYear, selected ? styles.weekOptionLabelActive : null]}>
                          {option.start.getFullYear()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            {timeMode === 'MONTH' ? (
              <>
                <Text style={styles.rangePickerTitle}>Tháng</Text>
                <View style={styles.rangeRowInline}>
                  <Pressable onPress={() => setTempYear((year) => year - 1)} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-back" size={18} color="#555" />
                  </Pressable>
                  <Text style={styles.rangeCurrentValue}>{tempYear}</Text>
                  <Pressable onPress={() => setTempYear((year) => year + 1)} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  </Pressable>
                </View>
                <View style={styles.monthGrid}>
                  {Array.from({ length: 12 }, (_, index) => (
                    <Pressable
                      key={`month-${index}`}
                      onPress={() => setTempMonth(index)}
                      style={[styles.monthItem, tempMonth === index ? styles.monthItemActive : null]}
                    >
                      <Text style={[styles.monthItemText, tempMonth === index ? styles.monthItemTextActive : null]}>
                        Thg {index + 1}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.rangeActionRow}>
                  <Pressable style={styles.rangeGhostBtn} onPress={() => setShowRangePickerModal(false)}>
                    <Text style={styles.rangeGhostBtnText}>Hủy</Text>
                  </Pressable>
                  <Pressable style={styles.rangeConfirmBtn} onPress={applyMonthSelection}>
                    <Text style={styles.rangeConfirmBtnText}>OK</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {timeMode === 'YEAR' ? (
              <>
                <Text style={styles.rangePickerTitle}>Năm</Text>
                <View style={styles.yearList}>
                  {[2023, 2024, 2025, 2026, 2027].map((year) => {
                    const selected = selectedDate.getFullYear() === year;
                    return (
                      <Pressable
                        key={`year-${year}`}
                        onPress={() => applyYearSelection(year)}
                        style={[styles.yearItem, selected ? styles.yearItemActive : null]}
                      >
                        <Text style={[styles.yearItemText, selected ? styles.yearItemTextActive : null]}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {timeMode === 'ALL' ? (
              <>
                <Text style={styles.rangePickerTitle}>Mọi thời gian</Text>
                <Text style={styles.allTimeHint}>Đang hiển thị tất cả giao dịch, không giới hạn ngày.</Text>
                <Pressable style={styles.rangeConfirmBtn} onPress={() => setShowRangePickerModal(false)}>
                  <Text style={styles.rangeConfirmBtnText}>Đóng</Text>
                </Pressable>
              </>
            ) : null}

            {timeMode === 'CUSTOM' ? (
              <>
                <Text style={styles.rangePickerTitle}>Chọn phạm vi</Text>
                <View style={styles.customModalRangeRow}>
                  <View style={styles.customModalCol}>
                    <Text style={styles.modalLabel}>Ngày bắt đầu</Text>
                    <Pressable
                      style={styles.calendarInput}
                      onPress={() => openCalendarPicker('customStart', tempCustomStartDate)}
                    >
                      <Ionicons name="calendar" size={18} color="#29bcc8" />
                      <Text style={styles.calendarInputText}>{tempCustomStartDate}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.customModalCol}>
                    <Text style={styles.modalLabel}>Ngày kết thúc</Text>
                    <Pressable
                      style={styles.calendarInput}
                      onPress={() => openCalendarPicker('customEnd', tempCustomEndDate)}
                    >
                      <Ionicons name="calendar" size={18} color="#29bcc8" />
                      <Text style={styles.calendarInputText}>{tempCustomEndDate}</Text>
                    </Pressable>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => {
                      const start = startOfWeek(new Date());
                      const end = endOfWeek(new Date());
                      setTempCustomStartDate(formatIsoDate(start));
                      setTempCustomEndDate(formatIsoDate(end));
                    }}
                  >
                    <Text style={styles.presetBtnText}>This Week</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => {
                      const month = toMonthRange(new Date());
                      setTempCustomStartDate(month.fromDate);
                      setTempCustomEndDate(month.toDate);
                    }}
                  >
                    <Text style={styles.presetBtnText}>This Month</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetBtn}
                    onPress={() => {
                      const end = new Date();
                      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
                      setTempCustomStartDate(formatIsoDate(start));
                      setTempCustomEndDate(formatIsoDate(end));
                    }}
                  >
                    <Text style={styles.presetBtnText}>Last 30 Days</Text>
                  </Pressable>
                </ScrollView>

                <View style={styles.rangeActionRow}>
                  <Pressable style={styles.rangeGhostBtn} onPress={() => setShowRangePickerModal(false)}>
                    <Text style={styles.rangeGhostBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.rangeConfirmBtn} onPress={applyCustomSelection}>
                    <Text style={styles.rangeConfirmBtnText}>Xác nhận</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
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
            <Text style={styles.rangePickerTitle}>Chọn ngày</Text>

            <View style={styles.calendarHeaderRow}>
              <Pressable
                onPress={() =>
                  setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                style={styles.monthNavBtn}
              >
                <Ionicons name="chevron-back" size={18} color="#555" />
              </Pressable>

              <Text style={styles.calendarMonthTitle}>
                {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </Text>

              <Pressable
                onPress={() =>
                  setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
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
              {calendarCells.map((cell, index) => {
                const selected = isSameDate(cell.date, calendarSelectedDate);
                return (
                  <Pressable
                    key={`${cell.date.toISOString()}-${index}`}
                    onPress={() => setCalendarSelectedDate(cell.date)}
                    style={[
                      styles.calendarCell,
                      selected ? styles.calendarCellSelected : null,
                    ]}
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
        visible={showSearchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tìm kiếm giao dịch</Text>
              <Pressable onPress={() => setShowSearchModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo danh mục, ghi chú, số tiền..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.searchScroll} contentContainerStyle={styles.searchResultsList}>
              {searchQuery.trim() === '' ? (
                <View style={styles.searchEmptyBox}>
                  <Text style={styles.searchEmptyText}>Nhập từ khóa để tìm kiếm giao dịch</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.searchResultsLabel}>Kết quả tìm kiếm</Text>
                  {transactions.length === 0 ? (
                    <View style={styles.searchEmptyBox}>
                      <Text style={styles.searchEmptyText}>Không tìm thấy giao dịch nào</Text>
                    </View>
                  ) : (
                    transactions.map((item) => {
                      const category = categoryMap.get(item.categoryId);
                      const isIncome = normalizeCategoryType(category?.type) === 'INCOME';
                      return (
                        <Pressable
                          key={item.transactionId}
                          style={styles.searchResultItem}
                          onPress={() => {
                            openEditTransactionModal(item);
                            setShowSearchModal(false);
                          }}
                        >
                          <View style={styles.searchResultIcon}>
                            <Text style={styles.searchResultIconText}>{category?.icon || '❓'}</Text>
                          </View>
                          <View style={styles.searchResultContent}>
                            <Text style={styles.searchResultCategory}>{category?.name || 'Danh mục'}</Text>
                            <Text style={styles.searchResultNote} numberOfLines={1}>
                              {item.note || 'Không có ghi chú'}
                            </Text>
                            <Text style={styles.searchResultDate}>{item.date}</Text>
                          </View>
                          <Text
                            style={[
                              styles.searchResultAmount,
                              isIncome ? styles.searchResultAmountIncome : styles.searchResultAmountExpense,
                            ]}
                          >
                            {isIncome ? '+' : '-'}
                            {formatVndAmount(item.amount)}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAIChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiChatSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trợ lý AI</Text>
              <Pressable onPress={() => setShowAIChatModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.aiChatScroll}
              contentContainerStyle={styles.aiChatMessagesList}
              showsVerticalScrollIndicator={false}
            >
              {aiChatMessages.length === 0 ? (
                <View style={styles.aiChatEmptyBox}>
                  <Ionicons name="sparkles" size={48} color="#29bcc8" />
                  <Text style={styles.aiChatEmptyTitle}>Xin chào! 👋</Text>
                  <Text style={styles.aiChatEmptyText}>Hỏi tôi bất cứ điều gì về chi tiêu, ngân sách của bạn</Text>
                </View>
              ) : (
                aiChatMessages.map((msg, index) => (
                  <View
                    key={index}
                    style={[styles.aiChatMessage, msg.role === 'user' ? styles.aiChatMessageUser : null]}
                  >
                    <View
                      style={[
                        styles.aiChatBubble,
                        msg.role === 'user' ? styles.aiChatBubbleUser : styles.aiChatBubbleAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.aiChatBubbleText,
                          msg.role === 'user' ? styles.aiChatBubbleTextUser : null,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.aiChatInputRow}>
              <TextInput
                style={styles.aiChatInput}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor="#999"
                value={aiInputText}
                onChangeText={setAiInputText}
                multiline
              />
              <Pressable
                style={styles.aiChatSendBtn}
                onPress={() => {
                  if (aiInputText.trim()) {
                    setAiChatMessages((prev) => [
                      ...prev,
                      { role: 'user', text: aiInputText.trim() },
                      { role: 'assistant', text: 'Tôi đang xử lý câu hỏi của bạn...' },
                    ]);
                    setAiInputText('');
                  }
                }}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const TimeModeButton = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <Pressable onPress={onPress} style={[styles.timeBtn, active ? styles.timeBtnActive : null]}>
      <Ionicons name={icon} size={24} color={active ? '#fff' : '#6a6f74'} />
      <Text style={[styles.timeBtnText, active ? styles.timeBtnTextActive : null]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 14,
  },
  walletChipRow: {
    gap: 10,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b6eef2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  walletChipActive: {
    backgroundColor: '#e9fbfd',
  },
  walletChipText: {
    color: '#23b8c2',
    fontSize: 16,
    fontWeight: '700',
  },
  monthFilterRow: {
    flexDirection: 'row',
  },
  filterBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dde2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  filterBoxText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1e1e',
  },
  monthNavigator: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dde2',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f3f6',
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#2f2f2f',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  customRangeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dde2',
    backgroundColor: '#fff',
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  customRangeCol: {
    flex: 1,
    gap: 6,
  },
  summaryBar: {
    borderRadius: 18,
    backgroundColor: '#ebebed',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseText: {
    color: '#f36e79',
    fontWeight: '700',
    fontSize: 16,
  },
  incomeText: {
    color: '#34a795',
    fontWeight: '700',
    fontSize: 16,
  },
  netText: {
    color: '#232323',
    fontWeight: '700',
    fontSize: 18,
  },
  groupWrap: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  groupDate: {
    fontSize: 16,
    color: '#5e676d',
    fontWeight: '600',
  },
  groupTotal: {
    fontSize: 16,
    color: '#444',
    fontWeight: '700',
  },
  transactionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d9e0e5',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e6f7f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconText: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#28333b',
  },
  transactionNote: {
    fontSize: 13,
    color: '#7b858c',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionExpense: {
    color: '#f36e79',
  },
  transactionIncome: {
    color: '#34a795',
  },
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9e0e5',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 94,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2c6389',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  categoryPickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    height: '84%',
    gap: 10,
  },
  categoryPickerScroll: {
    flex: 1,
    minHeight: 220,
  },
  categoryPickerContent: {
    gap: 10,
    paddingBottom: 8,
  },
  categoryPickerHint: {
    fontSize: 13,
    color: '#6a6f74',
    marginTop: -2,
  },
  rangePickerCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    maxHeight: '82%',
  },
  rangePickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1f1f',
    textAlign: 'center',
  },
  rangeRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rangeCurrentValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  calendarInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarInputText: {
    flex: 1,
    color: '#25323b',
    fontSize: 15,
    fontWeight: '600',
  },
  rangeActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeGhostBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeGhostBtnText: {
    color: '#56616a',
    fontSize: 16,
    fontWeight: '700',
  },
  rangeConfirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  weekList: {
    maxHeight: 320,
  },
  weekListContent: {
    gap: 8,
  },
  weekOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  weekOptionActive: {
    backgroundColor: '#29bcc8',
    borderColor: '#29bcc8',
  },
  weekOptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  weekOptionYear: {
    marginTop: 2,
    fontSize: 14,
    color: '#64707a',
  },
  weekOptionLabelActive: {
    color: '#fff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '23%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  monthItemActive: {
    backgroundColor: '#29bcc8',
    borderColor: '#29bcc8',
  },
  monthItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3e4a54',
  },
  monthItemTextActive: {
    color: '#fff',
  },
  yearList: {
    gap: 10,
  },
  yearItem: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  yearItemActive: {
    backgroundColor: '#29bcc8',
    borderColor: '#29bcc8',
  },
  yearItemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  yearItemTextActive: {
    color: '#fff',
  },
  allTimeHint: {
    textAlign: 'center',
    color: '#5d6972',
    fontSize: 14,
    marginBottom: 4,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f3a42',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  calendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#7b848d',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  calendarCell: {
    flexBasis: '14.2857%',
    maxWidth: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calendarCellSelected: {
    backgroundColor: '#29bcc8',
  },
  calendarCellText: {
    color: '#2d3942',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarCellTextMuted: {
    color: '#b1b8be',
  },
  calendarCellTextSelected: {
    color: '#fff',
  },
  customModalRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customModalCol: {
    flex: 1,
    gap: 6,
  },
  presetRow: {
    gap: 8,
  },
  presetBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  presetBtnText: {
    fontSize: 14,
    color: '#55616a',
    fontWeight: '600',
  },
  timeSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  timeHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d9dde2',
  },
  timeSheetTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeBtn: {
    width: '31%',
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  timeBtnActive: {
    backgroundColor: '#29bcc8',
    borderColor: '#29bcc8',
  },
  timeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2f3c47',
    textAlign: 'center',
  },
  timeBtnTextActive: {
    color: '#fff',
  },
  cancelTimeBtn: {
    marginTop: 4,
    borderRadius: 14,
    minHeight: 48,
    backgroundColor: '#eef1f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTimeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3f4950',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  modalLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#596269',
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    color: '#667179',
    backgroundColor: '#f5f7fa',
  },
  categoryPickerInput: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  categoryPickerValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryPickerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#c6f4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPickerIconText: {
    fontSize: 18,
  },
  categoryPickerValueText: {
    flex: 1,
    fontSize: 16,
    color: '#25323b',
    fontWeight: '600',
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  categoryRow: {
    gap: 8,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeToggleBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#eef1f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggleBtnActive: {
    backgroundColor: '#29bcc8',
  },
  typeToggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b4750',
  },
  typeToggleBtnTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emptyCategoryBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    padding: 16,
    backgroundColor: '#f7fafc',
  },
  categoryGridItem: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe2e8',
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 8,
  },
  categoryGridItemSelected: {
    borderColor: '#29bcc8',
    backgroundColor: '#e9fbfd',
  },
  categoryGridIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#c6f4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGridIconText: {
    fontSize: 22,
  },
  categoryGridLabel: {
    textAlign: 'center',
    color: '#28353f',
    fontSize: 12,
    fontWeight: '600',
  },
  addCategoryRow: {
    gap: 8,
    marginTop: 6,
  },
  openAddCategoryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8fdbe1',
    backgroundColor: '#ecfcfd',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  openAddCategoryButtonText: {
    color: '#179ea9',
    fontSize: 14,
    fontWeight: '700',
  },
  addCategoryInput: {
    minHeight: 44,
  },
  pickIconButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickIconValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#c6f4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickIconText: {
    fontSize: 18,
  },
  pickIconLabel: {
    fontSize: 15,
    color: '#25323b',
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconGridItem: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center',
    gap: 6,
  },
  iconGridItemSelected: {
    opacity: 1,
  },
  iconGridCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eef7f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconGridCircleSelected: {
    borderColor: '#29bcc8',
    backgroundColor: '#dff8fb',
  },
  iconGridText: {
    fontSize: 24,
  },
  iconGridName: {
    fontSize: 11,
    color: '#667179',
    textAlign: 'center',
  },
  addCategoryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addCategoryGhostButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addCategoryGhostButtonText: {
    color: '#4a5963',
    fontSize: 14,
    fontWeight: '700',
  },
  addCategoryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addCategoryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#edf1f5',
  },
  categoryChipActive: {
    backgroundColor: '#58c9d2',
  },
  categoryChipText: {
    color: '#2f3c47',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  searchModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    height: '88%',
    gap: 10,
  },
  searchInput: {
    marginTop: 0,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  searchScroll: {
    flex: 1,
  },
  searchResultsList: {
    paddingTop: 12,
    flexGrow: 1,
  },
  searchEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  searchEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  searchResultsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e5eb',
    backgroundColor: '#f9fbfc',
    padding: 12,
    marginBottom: 8,
  },
  searchResultIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#c6f4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultIconText: {
    fontSize: 20,
  },
  searchResultContent: {
    flex: 1,
    gap: 3,
  },
  searchResultCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25323b',
  },
  searchResultNote: {
    fontSize: 12,
    color: '#999',
  },
  searchResultDate: {
    fontSize: 11,
    color: '#aaa',
  },
  searchResultAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchResultAmountIncome: {
    color: '#2da76e',
  },
  searchResultAmountExpense: {
    color: '#ef4444',
  },
  aiChatSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    height: '88%',
    gap: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  aiChatMessagesList: {
    paddingTop: 12,
    paddingBottom: 12,
    flexGrow: 1,
  },
  aiChatScroll: {
    flex: 1,
  },
  aiChatEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  aiChatEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25323b',
    marginTop: 12,
  },
  aiChatEmptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  aiChatMessage: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  aiChatMessageUser: {
    justifyContent: 'flex-end',
  },
  aiChatBubble: {
    backgroundColor: '#e8f4f5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  aiChatBubbleUser: {
    backgroundColor: '#29bcc8',
  },
  aiChatBubbleText: {
    fontSize: 14,
    color: '#25323b',
    lineHeight: 20,
  },
  aiChatBubbleTextUser: {
    color: '#fff',
  },
  aiChatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
    minHeight: 56,
  },
  aiChatInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d5dde3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  aiChatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#29bcc8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});