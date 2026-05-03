import { useEffect, useMemo, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Category } from '@/modules/category/models/category.types';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { Wallet, WalletCreateInput, WalletType, WalletUpdateInput } from '@/modules/wallet/models/wallet.types';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { TransactionFilters } from '@/modules/transaction/models/transaction.types';
import { formatMoneyInput, parseMoneyInput, formatVndAmount, formatCurrency } from '@/shared/utils/money';

type CategoryType = 'EXPENSE' | 'INCOME';
type TimeMode = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL' | 'CUSTOM';
type CalendarTarget = 'customStart' | 'customEnd';

const walletTypeOptions: Array<{ label: string; value: WalletType }> = [
  { label: 'Thường', value: 'REGULAR' },
  { label: 'Tiền mặt', value: 'CASH' },
  { label: 'Tiết kiệm', value: 'SAVING' },
  { label: 'Nợ', value: 'DEBT' },
  { label: 'Đầu tư', value: 'INVEST' },
  { label: 'Sự kiện', value: 'EVENT' },
];

const currencyOptions = ['VND', 'USD', 'EUR'];

const timeModeLabel: Record<TimeMode, string> = {
  WEEK: 'Tuần này',
  MONTH: 'Tháng này',
  YEAR: 'Năm nay',
  ALL: 'Mọi thời gian',
  CUSTOM: 'Phạm vi tùy chỉnh',
};

const formatIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const formatDateShort = (value: Date) => `${value.getDate()} thg ${value.getMonth() + 1}`;

const startOfWeek = (value: Date) => {
  const cloned = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const day = cloned.getDay();
  const diff = (day + 6) % 7;
  cloned.setDate(cloned.getDate() - diff);
  return cloned;
};

const endOfWeek = (value: Date) => {
  const start = startOfWeek(value);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
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

const getMonthRange = (anchor: Date) => {
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { fromDate: formatIsoDate(start), toDate: formatIsoDate(end) };
};

const getTimeRange = (mode: TimeMode, anchorDate: Date, customStartDate: string, customEndDate: string) => {
  if (mode === 'ALL') {
    return { fromDate: undefined, toDate: undefined };
  }
  if (mode === 'CUSTOM') {
    return { fromDate: customStartDate || undefined, toDate: customEndDate || undefined };
  }
  if (mode === 'WEEK') {
    const start = startOfWeek(anchorDate);
    const end = endOfWeek(anchorDate);
    return { fromDate: formatIsoDate(start), toDate: formatIsoDate(end) };
  }
  if (mode === 'YEAR') {
    const year = anchorDate.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    return { fromDate: formatIsoDate(start), toDate: formatIsoDate(end) };
  }
  return getMonthRange(anchorDate);
};

const polarToCartesian = (center: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (center: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const DonutChart = ({
  data,
  size,
  strokeWidth,
}: {
  data: Array<{ value: number; color: string }>;
  size: number;
  strokeWidth: number;
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const singleSlice = data.length === 1 && data[0]?.value > 0;
  let startAngle = 0;

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke="#eef1f4" strokeWidth={strokeWidth} fill="none" />
      <G>
        {singleSlice ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={data[0].color}
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : (
          data.map((slice, index) => {
            const angle = (slice.value / total) * 360;
            const endAngle = startAngle + angle;
            const path = describeArc(center, radius, startAngle, endAngle);
            startAngle = endAngle;
            return (
              <Path
                key={`slice-${index}`}
                d={path}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          })
        )}
      </G>
    </Svg>
  );
};

export const WalletHomeScreen = () => {
  const { getWallets, createWallet, updateWallet, deleteWallet } = useWalletUsecases();
  const { getCategories } = useCategoryUsecases();
  const { getTransactions } = useTransactionUsecases();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('REGULAR');
  const [currency, setCurrency] = useState('VND');
  const [balance, setBalance] = useState('0');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editWalletId, setEditWalletId] = useState<string | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletType, setEditWalletType] = useState<WalletType>('REGULAR');
  const [editWalletCurrency, setEditWalletCurrency] = useState('VND');
  const [editWalletBalance, setEditWalletBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [categoryMode, setCategoryMode] = useState<CategoryType>('EXPENSE');
  const [timeMode, setTimeMode] = useState<TimeMode>('MONTH');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget>('customStart');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(formatIsoDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(formatIsoDate(new Date()));
  const [tempCustomStartDate, setTempCustomStartDate] = useState(customStartDate);
  const [tempCustomEndDate, setTempCustomEndDate] = useState(customEndDate);

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

  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].walletId);
    }
  }, [wallets, selectedWalletId]);

  const normalizeCategoryType = (value: unknown): CategoryType =>
    String(value || '').toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';

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
      size: 200,
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

  const categoryBreakdown = useMemo(() => {
    const palette = ['#60c5d1', '#8bc3ed', '#f6c04b', '#ef7d83', '#a98ff0', '#79d7a5'];
    const fallback: Category = {
      categoryId: 'unknown',
      name: 'Chưa được phân loại',
      type: categoryMode,
      icon: '❓',
      color: '#bfeff3',
      createdAt: new Date().toISOString(),
    };

    const totals = new Map<string, { category: Category; amount: number }>();
    let totalAmount = 0;

    transactions.forEach((item) => {
      const category = categoryMap.get(item.categoryId) ?? fallback;
      const categoryType = normalizeCategoryType(category.type);
      if (categoryType !== categoryMode) {
        return;
      }
      totalAmount += item.amount;
      const current = totals.get(category.categoryId) ?? { category, amount: 0 };
      current.amount += item.amount;
      totals.set(category.categoryId, current);
    });

    const sorted = Array.from(totals.values()).sort((a, b) => b.amount - a.amount);

    return sorted.map((item, index) => {
      const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
      const paletteColor = palette[index % palette.length];
      const rawColor = item.category.color || '';
      const color = rawColor && rawColor !== '#BFEFF3' ? rawColor : paletteColor;
      return {
        ...item,
        percentage,
        color,
      };
    });
  }, [transactions, categoryMap, categoryMode]);

  const transactionSummary = useMemo(() => {
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

  const totalCategoryAmount = useMemo(
    () => categoryBreakdown.reduce((sum, item) => sum + item.amount, 0),
    [categoryBreakdown],
  );

  const donutData = useMemo(
    () => categoryBreakdown.map((item) => ({ value: item.amount, color: item.color })),
    [categoryBreakdown],
  );

  const donutMarkers = useMemo(() => {
    const total = donutData.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      return [];
    }
    let startAngle = 0;
    return categoryBreakdown.slice(0, 6).map((item) => {
      const angle = (item.amount / total) * 360;
      const midAngle = startAngle + angle / 2;
      startAngle += angle;
      return {
        key: item.category.categoryId,
        icon: item.category.icon || '•',
        angle: midAngle,
        color: item.color,
      };
    });
  }, [categoryBreakdown, donutData]);

  const timeRangeLabel = useMemo(() => {
    if (timeMode === 'ALL') {
      return 'Mọi thời gian';
    }
    if (timeMode === 'CUSTOM') {
      const start = parseIsoDate(customStartDate);
      const end = parseIsoDate(customEndDate);
      if (!start || !end) {
        return 'Chọn phạm vi';
      }
      return `${formatDateShort(start)} - ${formatDateShort(end)}`;
    }
    if (timeMode === 'WEEK') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return `${formatDateShort(start)} - ${formatDateShort(end)}`;
    }
    if (timeMode === 'YEAR') {
      return `Năm ${selectedDate.getFullYear()}`;
    }
    return `${formatDateShort(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))} - ${formatDateShort(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
    )}`;
  }, [timeMode, selectedDate, customStartDate, customEndDate]);

  const shiftTimeRange = (direction: -1 | 1) => {
    if (timeMode === 'CUSTOM' || timeMode === 'ALL') {
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
    if (calendarTarget === 'customStart') {
      setTempCustomStartDate(value);
    }
    if (calendarTarget === 'customEnd') {
      setTempCustomEndDate(value);
    }
    setShowCalendarModal(false);
  };

  const calendarCells = useMemo(() => buildCalendarMatrix(calendarMonth), [calendarMonth]);

  const applyCustomRange = () => {
    const start = parseIsoDate(tempCustomStartDate);
    const end = parseIsoDate(tempCustomEndDate);
    if (!start || !end) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập đúng định dạng YYYY-MM-DD.');
      return;
    }
    if (start > end) {
      Alert.alert('Khoảng ngày không hợp lệ', 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
      return;
    }
    setCustomStartDate(tempCustomStartDate);
    setCustomEndDate(tempCustomEndDate);
    setShowRangeModal(false);
  };

  const walletDistribution = useMemo(() => {
    const colors = ['#8BC3ED', '#58C9D2', '#F6C04B', '#EF7D83', '#A98FF0'];
    const total = wallets.reduce((sum, wallet) => sum + Math.max(wallet.currentBalance ?? 0, 0), 0);

    return wallets
      .slice()
      .sort((a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0))
      .slice(0, 5)
      .map((wallet, index) => {
        const value = Math.max(wallet.currentBalance ?? 0, 0);
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return {
          wallet,
          value,
          percentage,
          color: colors[index % colors.length],
        };
      });
  }, [wallets]);

  const createWalletHandler = async () => {
    const payload: WalletCreateInput = {
      name: walletName.trim(),
      type: walletType,
      currency: currency.trim().toUpperCase() || 'VND',
      currentBalance: parseMoneyInput(balance),
      description: description.trim() || null,
    };

    if (!payload.name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví.');
      return;
    }

    try {
      await createWallet(payload);
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setWalletName('');
      setWalletType('REGULAR');
      setCurrency('VND');
      setBalance('0');
      setDescription('');
      setShowCreateModal(false);
      Alert.alert('Thành công', 'Đã tạo ví mới.');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo ví. Vui lòng thử lại.');
    }
  };

  const openEditWalletModal = (wallet: Wallet) => {
    setEditWalletId(wallet.walletId);
    setEditWalletName(wallet.name);
    setEditWalletType(wallet.type as WalletType);
    setEditWalletCurrency(wallet.currency || 'VND');
    setEditWalletBalance(wallet.currentBalance?.toString() || '0');
    setShowEditModal(true);
  };

  const updateWalletHandler = async () => {
    if (!editWalletId || !editWalletName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên ví');
      return;
    }
    const payload: WalletUpdateInput = {
      name: editWalletName.trim(),
      type: editWalletType,
      currency: editWalletCurrency.trim().toUpperCase() || 'VND',
    };
    try {
      await updateWallet(editWalletId, payload);
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setShowEditModal(false);
      Alert.alert('Thành công', 'Đã cập nhật ví.');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể cập nhật ví. Vui lòng thử lại.');
    }
  };

  const deleteWalletHandler = () => {
    if (!editWalletId) return;
    Alert.alert(
      'Xoá ví',
      'Bạn có chắc chắn muốn xoá ví này? Hành động này không thể hoàn tác và sẽ xoá toàn bộ giao dịch trong ví.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWallet(editWalletId);
              await queryClient.invalidateQueries({ queryKey: ['wallets'] });
              setShowEditModal(false);
              Alert.alert('Thành công', 'Đã xoá ví.');
            } catch (error) {
              console.error(error);
              Alert.alert('Lỗi', 'Không thể xoá ví. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={[styles.quickCard, styles.milestoneCard]}>
            <Text style={styles.quickCardText}>Những cột mốc</Text>
          </View>
          <View style={[styles.quickCard, styles.analysisCard]}>
            <Text style={styles.quickCardText}>Phân tích thêm</Text>
          </View>
        </View>

        <View style={styles.botWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Chào bạn! 👋</Text>
          </View>
          <View style={styles.botCircle}>
            <Ionicons name="sparkles" size={34} color="#4c88ff" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Số dư ví</Text>
          <Text style={styles.sectionSubtitle}>Chọn ví để xem chi tiết</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletCarouselContent}>
          {wallets.map((wallet) => {
            const selected = wallet.walletId === selectedWalletId;
            return (
              <Pressable
                key={wallet.walletId}
                onPress={() => setSelectedWalletId(wallet.walletId)}
                style={[styles.walletTile, selected ? styles.walletTileActive : null]}
              >
                <View style={[styles.walletTileHeader, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MaterialIcons name="account-balance-wallet" size={18} color={selected ? '#1f6681' : '#5d707a'} />
                    <Text style={[styles.walletTileName, selected ? styles.walletTileNameActive : null]} numberOfLines={1}>
                      {wallet.name}
                    </Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => openEditWalletModal(wallet)}>
                    <Ionicons name="pencil" size={16} color={selected ? '#1f6681' : '#5d707a'} />
                  </Pressable>
                </View>
                <Text style={[styles.walletTileBalance, selected ? styles.walletTileBalanceActive : null]}>
                  {formatCurrency(wallet.currentBalance ?? 0, wallet.currency || 'VND')}
                </Text>
                <Text style={styles.walletTileCurrency}>{wallet.currency}</Text>
              </Pressable>
            );
          })}

          <Pressable style={[styles.walletTile, styles.walletAddTile]} onPress={() => setShowCreateModal(true)}>
            <View style={styles.walletAddIcon}>
              <Ionicons name="add" size={20} color="#7a8a92" />
            </View>
            <Text style={styles.walletAddText}>Ví mới</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cơ cấu số dư theo ví</Text>
          {walletDistribution.length === 0 ? (
            <Text style={styles.chartEmpty}>Chưa có dữ liệu để hiển thị biểu đồ.</Text>
          ) : (
            walletDistribution.map((item) => (
              <View key={item.wallet.walletId} style={styles.chartRow}>
                <View style={[styles.chartDot, { backgroundColor: item.color }]} />
                <Text style={styles.chartWalletName} numberOfLines={1}>
                  {item.wallet.name}
                </Text>
                <Text style={styles.chartPercent}>{item.percentage.toFixed(0)}%</Text>
                <Text style={styles.chartAmount}>{formatCurrency(item.value, item.wallet.currency || 'VND')}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Phân tích theo ví</Text>
          <Text style={styles.sectionSubtitle}>Lọc giao dịch</Text>
        </View>

        <View style={styles.filterRow}>
          <Pressable style={styles.filterBox} onPress={() => setShowTimeModal(true)}>
            <Text style={styles.filterBoxText}>{timeModeLabel[timeMode]}</Text>
            <Ionicons name="chevron-down" size={18} color="#1f1f1f" />
          </Pressable>
        </View>

        <View style={styles.rangeRow}>
          <Pressable style={styles.rangeNav} onPress={() => shiftTimeRange(-1)}>
            <Ionicons
              name="chevron-back"
              size={18}
              color={timeMode === 'CUSTOM' || timeMode === 'ALL' ? '#c0c0c0' : '#1f1f1f'}
            />
          </Pressable>
          <Pressable style={styles.rangeLabel} onPress={() => timeMode === 'CUSTOM' && setShowRangeModal(true)}>
            <Text style={styles.rangeText} numberOfLines={1}>
              {timeRangeLabel}
            </Text>
          </Pressable>
          <Pressable style={styles.rangeNav} onPress={() => shiftTimeRange(1)}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={timeMode === 'CUSTOM' || timeMode === 'ALL' ? '#c0c0c0' : '#1f1f1f'}
            />
          </Pressable>
        </View>

        <View style={styles.netGroupCard}>
          <View style={styles.netSummaryRow}>
            <Text style={styles.netTitle}>Thay đổi ròng</Text>
            <Text style={styles.netValue}> {formatCurrency(transactionSummary.net, currentWallet?.currency || 'VND')}</Text>
          </View>

          <View style={styles.netBreakRow}>
            <View style={styles.netBreakCard}>
              <Text style={styles.netBreakLabel}>Chi phí</Text>
              <Text style={styles.netBreakValueExpense}>▼ {formatCurrency(transactionSummary.expense, currentWallet?.currency || 'VND')}</Text>
            </View>
            <View style={styles.netBreakCard}>
              <Text style={styles.netBreakLabel}>Thu nhập</Text>
              <Text style={styles.netBreakValueIncome}>▲ {formatCurrency(transactionSummary.income, currentWallet?.currency || 'VND')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.segmentRow}>
          <Pressable
            style={[styles.segmentPill, categoryMode === 'EXPENSE' ? styles.segmentPillActive : null]}
            onPress={() => setCategoryMode('EXPENSE')}
          >
            <Text style={[styles.segmentText, categoryMode === 'EXPENSE' ? styles.segmentTextActive : null]}>
              Chi phí
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentPill, categoryMode === 'INCOME' ? styles.segmentPillActive : null]}
            onPress={() => setCategoryMode('INCOME')}
          >
            <Text style={[styles.segmentText, categoryMode === 'INCOME' ? styles.segmentTextActive : null]}>
              Thu nhập
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>
              Cơ cấu {categoryMode === 'EXPENSE' ? 'chi phí' : 'thu nhập'}
            </Text>
            <Text style={styles.chartHint}>{currentWallet?.name ?? 'Chọn ví'}</Text>
          </View>
          {transactionsQuery.isLoading || categoriesQuery.isLoading ? (
            <Text style={styles.chartEmpty}>Đang tải dữ liệu...</Text>
          ) : categoryBreakdown.length === 0 ? (
            <Text style={styles.chartEmpty}>Chưa có giao dịch để hiển thị biểu đồ.</Text>
          ) : (
            <>
              <View style={styles.donutWrap}>
                <DonutChart data={donutData} size={190} strokeWidth={28} />
                <View style={styles.donutMarkers}>
                  {donutMarkers.map((marker) => {
                    const center = 95;
                    const orbit = 88;
                    const angle = ((marker.angle - 90) * Math.PI) / 180;
                    const x = center + orbit * Math.cos(angle) - 18;
                    const y = center + orbit * Math.sin(angle) - 18;
                    return (
                      <View
                        key={marker.key}
                        style={[styles.donutMarker, { left: x, top: y, borderColor: marker.color }]}
                      >
                        <Text style={styles.donutMarkerText}>{marker.icon}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.donutCenter}>
                  <Text style={styles.donutValue}>
                    {formatCurrency(totalCategoryAmount, currentWallet?.currency || 'VND')}
                  </Text>
                  <Text style={styles.donutLabel}>
                    Tổng {categoryMode === 'EXPENSE' ? 'chi phí' : 'thu nhập'}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryList}>
                {categoryBreakdown.map((item) => (
                  <View key={item.category.categoryId} style={styles.categoryRow}>
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryIconText}>{item.category.icon || '•'}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeaderRow}>
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {item.category.name}
                        </Text>
                        <Text style={styles.categoryAmount} numberOfLines={1}>
                          {formatCurrency(item.amount, currentWallet?.currency || 'VND')}
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.max(item.percentage, 2)}%`, backgroundColor: item.color },
                          ]}
                        />
                        <View style={styles.progressBadge}>
                          <Text style={styles.progressBadgeText}>{item.percentage.toFixed(0)}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => {
          if (!selectedWalletId) {
            Alert.alert('Chưa chọn ví', 'Vui lòng chọn một ví để tạo giao dịch.');
            return;
          }
          router.push({
            pathname: '/(tabs)/transactions',
            params: { walletId: selectedWalletId, openCreate: '1' },
          });
        }}
      >
        <Ionicons name="add" size={36} color="#fff" />
      </Pressable>

      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.createTitle}>Tạo ví mới</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tên ví"
              placeholderTextColor="#8b8b8b"
              value={walletName}
              onChangeText={setWalletName}
            />

            <View style={styles.pillWrap}>
              {walletTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setWalletType(option.value)}
                  style={[styles.pill, walletType === option.value ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, walletType === option.value ? styles.pillTextActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                placeholder="Số dư ban đầu"
                placeholderTextColor="#8b8b8b"
                value={balance}
                onChangeText={(text) => setBalance(formatMoneyInput(text))}
                keyboardType="numeric"
              />
              <View style={[styles.currencyBox, styles.rowInput]}>
                {currencyOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[styles.currencyChip, currency === item ? styles.currencyChipActive : null]}
                  >
                    <Text style={[styles.currencyChipText, currency === item ? styles.currencyChipTextActive : null]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Mô tả"
              placeholderTextColor="#8b8b8b"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Pressable
              onPress={createWalletHandler}
              style={({ pressed }) => [styles.createButton, pressed ? styles.createButtonPressed : null]}
            >
              <Text style={styles.createButtonText}>Tạo ví</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showTimeModal} animationType="fade" transparent onRequestClose={() => setShowTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.timeModalSheet}>
            <Text style={styles.timeModalTitle}>Chọn phạm vi</Text>
            {(['WEEK', 'MONTH', 'YEAR', 'ALL', 'CUSTOM'] as TimeMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => {
                  setTimeMode(mode);
                  setShowTimeModal(false);
                  if (mode === 'CUSTOM') {
                    setTempCustomStartDate(customStartDate);
                    setTempCustomEndDate(customEndDate);
                    setShowRangeModal(true);
                  }
                }}
                style={[styles.timeOption, timeMode === mode ? styles.timeOptionActive : null]}
              >
                <Text style={[styles.timeOptionText, timeMode === mode ? styles.timeOptionTextActive : null]}>
                  {timeModeLabel[mode]}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.timeCloseButton} onPress={() => setShowTimeModal(false)}>
              <Text style={styles.timeCloseText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showRangeModal} animationType="slide" transparent onRequestClose={() => setShowRangeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rangeModalSheet}>
            <Text style={styles.timeModalTitle}>Phạm vi tùy chỉnh</Text>
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

            <View style={styles.rangeActionRow}>
              <Pressable style={styles.rangeGhostBtn} onPress={() => setShowRangeModal(false)}>
                <Text style={styles.rangeGhostBtnText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.rangeConfirmBtn} onPress={applyCustomRange}>
                <Text style={styles.rangeConfirmBtnText}>Áp dụng</Text>
              </Pressable>
            </View>
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
            <Text style={styles.timeModalTitle}>Chọn ngày</Text>

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

      <Modal visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <Pressable hitSlop={10} onPress={() => setShowEditModal(false)}>
              <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
            </Pressable>
            <Text style={styles.editModalTitle}>Chỉnh sửa ví</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.editModalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên ví</Text>
              <TextInput
                style={styles.textInput}
                value={editWalletName}
                onChangeText={setEditWalletName}
                placeholder="Nhập tên ví"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loại ví</Text>
              <View style={styles.pillWrap}>
                {(['REGULAR', 'CASH', 'SAVING', 'DEBT', 'INVEST', 'EVENT'] as WalletType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setEditWalletType(type)}
                    style={[styles.pillBtn, editWalletType === type ? styles.pillBtnActive : null]}
                  >
                    <Text style={[styles.pillBtnText, editWalletType === type ? styles.pillBtnTextActive : null]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tiền tệ</Text>
              <View style={styles.pillWrap}>
                {['VND', 'USD', 'EUR'].map((cur) => (
                  <Pressable
                    key={cur}
                    onPress={() => setEditWalletCurrency(cur)}
                    style={[styles.pillBtn, editWalletCurrency === cur ? styles.pillBtnActive : null]}
                  >
                    <Text style={[styles.pillBtnText, editWalletCurrency === cur ? styles.pillBtnTextActive : null]}>
                      {cur}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số dư ban đầu</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={formatMoneyInput(editWalletBalance)}
                editable={false}
              />
            </View>

            <View style={styles.editActionRow}>
              <Pressable style={styles.btnSave} onPress={updateWalletHandler}>
                <Text style={styles.btnSaveText}>Lưu</Text>
              </Pressable>
              <Pressable style={styles.btnDelete} onPress={deleteWalletHandler}>
                <Text style={styles.btnDeleteText}>Xóa ví</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  milestoneCard: {
    backgroundColor: '#f6c04b',
  },
  analysisCard: {
    backgroundColor: '#d8f2f5',
  },
  quickCardText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  botWrap: {
    alignItems: 'center',
    gap: 6,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  bubbleText: {
    fontSize: 16,
    color: '#333',
  },
  botCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  walletCarouselContent: {
    paddingHorizontal: 2,
    gap: 12,
  },
  walletTile: {
    width: 160,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#eef7f8',
    borderWidth: 1,
    borderColor: '#dce7eb',
    gap: 10,
  },
  walletTileActive: {
    backgroundColor: '#d8f5f8',
    borderColor: '#29bcc8',
  },
  walletTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletTileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#3b4a52',
  },
  walletTileNameActive: {
    color: '#1f2f36',
  },
  walletTileBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2f36',
  },
  walletTileBalanceActive: {
    color: '#154b5a',
  },
  walletTileCurrency: {
    fontSize: 12,
    color: '#6a7a82',
  },
  walletAddTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f3f5',
    borderStyle: 'dashed',
  },
  walletAddIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6dde2',
  },
  walletAddText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6f7c84',
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28333b',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartHint: {
    fontSize: 12,
    color: '#7b878f',
  },
  chartEmpty: {
    fontSize: 13,
    color: '#6f7478',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  chartWalletName: {
    flex: 1,
    fontSize: 13,
    color: '#2f3a42',
  },
  chartPercent: {
    width: 46,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#2f3a42',
  },
  chartAmount: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    color: '#5c6872',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  filterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6ea',
  },
  filterBoxText: {
    fontSize: 13,
    color: '#1f1f1f',
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  rangeNav: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6ea',
  },
  rangeLabel: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6ea',
  },
  rangeText: {
    fontSize: 13,
    color: '#1f1f1f',
    textAlign: 'center',
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#eef1f4',
  },
  segmentPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#dde2e6',
  },
  segmentPillActive: {
    backgroundColor: '#23b8c2',
  },
  segmentText: {
    fontSize: 13,
    color: '#56616a',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  netGroupCard: {
    borderRadius: 18,
    backgroundColor: '#dff7f5',
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#cfecec',
  },
  netSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netTitle: {
    fontSize: 13,
    color: '#6b7782',
    fontWeight: '600',
  },
  netValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b2a2d',
  },
  netBreakRow: {
    flexDirection: 'row',
    gap: 10,
  },
  netBreakCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3e8ec',
    alignItems: 'center',
  },
  netBreakLabel: {
    fontSize: 12,
    color: '#6b7782',
    fontWeight: '600',
  },
  netBreakValueExpense: {
    marginTop: 4,
    fontSize: 13,
    color: '#f36e79',
    fontWeight: '700',
  },
  netBreakValueIncome: {
    marginTop: 4,
    fontSize: 13,
    color: '#34a795',
    fontWeight: '700',
  },
  categoryList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    gap: 16,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e8f8f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 26,
  },
  categoryInfo: {
    flex: 1,
    gap: 8,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#2f3a42',
    fontWeight: '600',
  },
  progressTrack: {
    position: 'relative',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eef1f4',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#2f3a42',
    fontWeight: '700',
  },
  progressBadge: {
    position: 'absolute',
    left: '50%',
    top: -10,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d3dbe0',
    backgroundColor: '#fff',
    transform: [{ translateX: -18 }],
    elevation: 2,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f6b75',
  },
  timeModalSheet: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  timeModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28333b',
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f4f6f8',
  },
  timeOptionActive: {
    backgroundColor: '#23b8c2',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#39434a',
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: '#fff',
  },
  timeCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timeCloseText: {
    fontSize: 14,
    color: '#23b8c2',
    fontWeight: '600',
  },
  rangeModalSheet: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f3f6',
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
  categoryAmount: {
    width: 110,
    textAlign: 'right',
    fontSize: 12,
    color: '#2f3a42',
    fontWeight: '700',
  },
  progressTrack: {
    position: 'relative',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eef1f4',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressBadge: {
    position: 'absolute',
    left: '50%',
    top: -10,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d3dbe0',
    backgroundColor: '#fff',
    transform: [{ translateX: -18 }],
    elevation: 2,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f6b75',
  },
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
  calendarInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dde2',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  modalLabel: {
    fontSize: 13,
    color: '#5f6b75',
    fontWeight: '600',
  },
  customModalRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customModalCol: {
    flex: 1,
    gap: 6,
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
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutMarkers: {
    position: 'absolute',
    width: 190,
    height: 190,
  },
  donutMarker: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  donutMarkerText: {
    fontSize: 16,
  },
  donutValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
  },
  donutLabel: {
    fontSize: 12,
    color: '#7b878f',
    marginTop: 4,
  },
  loadingCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  walletCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  walletType: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b6f74',
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f6681',
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  walletCurrency: {
    fontSize: 13,
    color: '#5f7c84',
    fontWeight: '700',
  },
  walletDescription: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: '#6f6f6f',
  },
  createCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8ebef',
  },
  createTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  descriptionInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eef1f5',
  },
  pillActive: {
    backgroundColor: '#58c9d2',
  },
  pillText: {
    fontSize: 13,
    color: '#3f4950',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  currencyBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8dde3',
    backgroundColor: '#fff',
  },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eef1f5',
  },
  currencyChipActive: {
    backgroundColor: '#58c9d2',
  },
  currencyChipText: {
    fontSize: 12,
    color: '#3f4950',
    fontWeight: '700',
  },
  currencyChipTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#29bcc8',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
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
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f8fafc',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  editModalBody: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#636a70',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f1f1f',
  },
  textInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  editActionRow: {
    marginTop: 20,
    gap: 16,
  },
  btnSave: {
    backgroundColor: '#1dc4c0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDelete: {
    backgroundColor: '#fb7185',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});