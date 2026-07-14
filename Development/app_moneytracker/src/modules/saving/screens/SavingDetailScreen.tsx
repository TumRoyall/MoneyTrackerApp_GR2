import { useMemo, useState } from 'react';
import { X, Plus, Wallet, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { Button, BackButton, DatePickerModal, colors, spacing } from '@/components/common';
import { useSavingUsecases } from '@/modules/saving/usecases';
import { SavingPeriodUnit, SavingType } from '@/modules/saving/models/saving.types';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { Transaction } from '@/modules/transaction/models/transaction.types';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

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

const transferMetaRegex = /\[saving-transfer:walletId=([^;\]]+);savingId=([^\]]+)\]/;

const getTransferMeta = (note?: string | null) => {
  if (!note) {
    return null;
  }
  const match = note.match(transferMetaRegex);
  if (!match) {
    return null;
  }
  return { walletId: match[1], savingId: match[2] };
};

const stripTransferMeta = (note?: string | null) => {
  if (!note) {
    return '';
  }
  return note.replace(transferMetaRegex, '').trim();
};

const formatActivityDate = (value: string) => {
  const [year, month, day] = value.split('-').map((item) => Number(item));
  if (!year || !month || !day) {
    return value;
  }
  const date = new Date(year, month - 1, day);
  const weekdays = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  return `${weekdays[date.getDay()]}, ${day} thg ${month}, ${year}`;
};

const formatShortAmount = (val: number) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
  return val.toString();
};

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
  const queryClient = useQueryClient();

  const { getSaving } = useSavingUsecases();
  const { getCategories, createCategory } = useCategoryUsecases();
  const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactionUsecases();
  const { getWallets } = useWalletUsecases();

  const savingQuery = useQuery({
    queryKey: ['saving', savingId],
    queryFn: () => getSaving(savingId),
    enabled: Boolean(savingId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const saving = savingQuery.data;
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState(true);
  const [selectedSourceWalletId, setSelectedSourceWalletId] = useState<string | null>(null);
  const [formNote, setFormNote] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(toIsoDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recordModalMode, setRecordModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<Transaction | null>(null);
  const [editingTransferWalletId, setEditingTransferWalletId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'stats'>('activity');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTargetWalletId, setWithdrawTargetWalletId] = useState<string | null>(null);
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(toIsoDate(new Date()));
  const [showWithdrawDatePicker, setShowWithdrawDatePicker] = useState(false);

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
  const activityQuery = useQuery({
    queryKey: ['saving-activity', savingId],
    queryFn: () =>
      getTransactions({
        walletId: saving?.walletId ?? undefined,
        page: 0,
        size: 200,
        sort: 'date,desc',
      }),
    enabled: Boolean(saving?.walletId),
  });
  const activityItems = activityQuery.data ?? [];
  const periodSaved = savingType === 'periodic' ? sumSignedAmount(transactions, categoryMap) : 0;
  const savingWallet = wallets.find((w) => w.walletId === saving?.walletId);
  const totalSaved = savingWallet ? Number(savingWallet.currentBalance || 0) : Number(saving?.currentBalance || 0);
  const targetAmount = saving?.targetAmount ?? 0;
  const progressValue = savingType === 'periodic' ? periodSaved : totalSaved;
  const percent = targetAmount > 0 ? Math.min((progressValue / targetAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(targetAmount - progressValue, 0);

  const targetDateStr = saving?.targetDate;
  const targetDateObj = targetDateStr ? new Date(targetDateStr) : null;
  const daysRemaining = targetDateObj
    ? Math.ceil((targetDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : null;

  const chartData = useMemo(() => {
    if (savingType !== 'periodic' || activeTab !== 'stats') return [];

    const buckets: { label: string; total: number; fullDate: string }[] = [];

    if (periodUnit === 'monthly') {
      const anchor = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
        const label = `T${d.getMonth() + 1}`;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ label, total: 0, fullDate: key });
      }
    } else {
      const anchor = new Date();
      for (let i = 4; i >= 0; i--) {
        const d = new Date(anchor.getFullYear() - i, 0, 1);
        const label = `${d.getFullYear()}`;
        const key = `${d.getFullYear()}`;
        buckets.push({ label, total: 0, fullDate: key });
      }
    }

    activityItems.forEach(item => {
      if (!item.date) return;
      let key = '';
      if (periodUnit === 'monthly') {
        key = item.date.substring(0, 7);
      } else {
        key = item.date.substring(0, 4);
      }

      const bucket = buckets.find(b => b.fullDate === key);
      if (bucket) {
        const type = normalizeCategoryType(categoryMap.get(item.categoryId)?.type || item.type);
        const amt = Number(item.amount || 0);
        if (type === 'EXPENSE') {
          bucket.total -= amt;
        } else {
          bucket.total += amt;
        }
      }
    });

    return buckets;
  }, [activityItems, categoryMap, periodUnit, savingType, activeTab]);

  const maxChartValue = Math.max(targetAmount, ...chartData.map(d => d.total));

  const regularWallets = useMemo(
    () =>
      wallets.filter((wallet) => {
        const type = String(wallet.type || '').toUpperCase();
        if (wallet.walletId === saving?.walletId) {
          return false;
        }
        return type === 'REGULAR' || type === 'CASH';
      }),
    [wallets, saving?.walletId],
  );

  const movePeriod = (step: number) => {
    setPeriodAnchor((current) => {
      if (periodUnit === 'yearly') {
        return new Date(current.getFullYear() + step, current.getMonth(), 1);
      }
      return new Date(current.getFullYear(), current.getMonth() + step, 1);
    });
  };

  const resetRecordForm = () => {
    setTransferFromWallet(true);
    setSelectedSourceWalletId(null);
    setFormNote('');
    setFormAmount('');
    setFormDate(toIsoDate(new Date()));
    setRecordModalMode('create');
    setEditingRecord(null);
    setEditingTransferWalletId(null);
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount('');
    setWithdrawTargetWalletId(null);
    setWithdrawNote('');
    setWithdrawDate(toIsoDate(new Date()));
  };

  const ensureWithdrawCategoryId = async () => {
    const type = 'INCOME';
    const name = 'Rút tiết kiệm';
    const existing = categories.find(
      (item) => normalizeCategoryType(item.type) === type && item.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      return existing.categoryId;
    }
    
    try {
      const created = await createCategory({
        name,
        icon: 'PiggyBank',
        color: '#4CAF50',
        type,
      });
      return created.categoryId;
    } catch (e) {
      const fallback = categories.find(c => normalizeCategoryType(c.type) === type);
      if (fallback) return fallback.categoryId;
      throw new Error('Fallback failed');
    }
  };

  const openWithdrawModal = () => {
    resetWithdrawForm();
    setShowWithdrawModal(true);
  };

  const submitWithdraw = async () => {
    if (!saving?.walletId) {
      Alert.alert('Thiếu ví', 'Không tìm thấy ví tiết kiệm.');
      return;
    }

    const amountValue = parseMoneyInput(withdrawAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (amountValue > totalSaved) {
      Alert.alert('Số tiền không hợp lệ', 'Số tiền rút không được lớn hơn tổng đã tiết kiệm.');
      return;
    }

    if (!withdrawTargetWalletId) {
      Alert.alert('Thiếu ví nhận', 'Vui lòng chọn ví để nhận tiền.');
      return;
    }

    try {
      const expenseCategoryId = await ensureSavingCategoryId('EXPENSE');
      const incomeCategoryId = await ensureWithdrawCategoryId();
      const baseNote = withdrawNote.trim() || 'Rút tiền tiết kiệm';
      const dateValue = withdrawDate || toIsoDate(new Date());

      const transferNote = buildTransferNote(baseNote, withdrawTargetWalletId);

      await createTransaction({
        walletId: saving.walletId,
        categoryId: expenseCategoryId,
        amount: amountValue,
        type: 'EXPENSE',
        note: transferNote,
        date: dateValue,
      });

      await createTransaction({
        walletId: withdrawTargetWalletId,
        categoryId: incomeCategoryId,
        amount: amountValue,
        type: 'INCOME',
        note: transferNote,
        date: dateValue,
      });

      await queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
      await queryClient.invalidateQueries({ queryKey: ['savings'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions-all-for-budgets'] });
      await queryClient.invalidateQueries({ queryKey: ['saving-transactions', savingId] });
      await queryClient.invalidateQueries({ queryKey: ['saving-period-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['saving-activity', savingId] });

      resetWithdrawForm();
      setShowWithdrawModal(false);
      Alert.alert('Thành công', 'Đã rút tiền thành công.');
    } catch {
      Alert.alert('Lỗi', 'Không thể rút tiền. Vui lòng thử lại.');
    }
  };

  const isSavingCategoryName = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'tiết kiệm' || normalized === 'tiet kiem';
  };

  const ensureSavingCategoryId = async (type: 'INCOME' | 'EXPENSE') => {
    // Categories are hardcoded in the local DB (migration v4). The "Tiết
    // kiệm" row is in the `savings` group. Just look it up by name + type
    // — no creation needed.
    const existing = categories.find(
      (item) => normalizeCategoryType(item.type) === type && isSavingCategoryName(item.name),
    );
    if (existing) {
      return existing.categoryId;
    }
    const byGroup = categories.find(
      (item) => item.groupId === 'savings' && normalizeCategoryType(item.type) === type,
    );
    if (byGroup) {
      return byGroup.categoryId;
    }
    
    // Auto-create if missing
    try {
      const created = await createCategory({
        name: 'Tiết kiệm',
        icon: 'PiggyBank',
        color: '#F59E0B',
        type,
      });
      return created.categoryId;
    } catch (e) {
      const fallback = categories.find(c => normalizeCategoryType(c.type) === type);
      if (fallback) return fallback.categoryId;
      throw new Error('Saving category not seeded and fallback failed');
    }
  };

  const openCreateRecordModal = () => {
    resetRecordForm();
    setRecordModalMode('create');
    setShowAddRecordModal(true);
  };

  const openEditRecordModal = (record: Transaction) => {
    const meta = getTransferMeta(record.note);
    setRecordModalMode('edit');
    setEditingRecord(record);
    setEditingTransferWalletId(meta?.walletId ?? null);
    setFormNote(stripTransferMeta(record.note));
    setFormAmount(formatMoneyInput(record.amount));
    setFormDate(record.date);
    setTransferFromWallet(Boolean(meta?.walletId));
    setSelectedSourceWalletId(meta?.walletId ?? null);
    setShowAddRecordModal(true);
  };

  const buildTransferNote = (baseNote: string, sourceWalletId: string) => {
    const metaToken = `[saving-transfer:walletId=${sourceWalletId};savingId=${savingId}]`;
    if (!baseNote.trim()) {
      return metaToken;
    }
    return `${baseNote.trim()} ${metaToken}`;
  };

  const submitAddRecord = async () => {
    if (!saving?.walletId) {
      Alert.alert('Thiếu ví', 'Không tìm thấy ví tiết kiệm cho mục tiêu này.');
      return;
    }

    const amountValue = parseMoneyInput(formAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (transferFromWallet && !selectedSourceWalletId) {
      Alert.alert('Thiếu ví nguồn', 'Vui lòng chọn ví để chuyển vào tiết kiệm.');
      return;
    }

    const sourceWallet = wallets.find((wallet) => wallet.walletId === selectedSourceWalletId) || null;
    if (transferFromWallet && sourceWallet) {
      const isDebtWallet = String(sourceWallet.type || '').toUpperCase() === 'DEBT';
      let projectedBalance = (sourceWallet.currentBalance ?? 0) - amountValue;

      if (recordModalMode === 'edit' && editingRecord) {
        projectedBalance = (sourceWallet.currentBalance ?? 0) + editingRecord.amount - amountValue;
      }

      if (!isDebtWallet && projectedBalance < 0) {
        Alert.alert(
          'Không đủ số dư',
          `Giao dịch này sẽ làm ví âm ${formatVndAmount(Math.abs(projectedBalance))}. Vui lòng giảm số tiền hoặc chọn ví khác.`,
        );
        return;
      }
    }

    try {
      const incomeCategoryId = await ensureSavingCategoryId('INCOME');

      if (recordModalMode === 'edit' && editingRecord) {
        const baseNote = formNote.trim();
        const metaWalletId = editingTransferWalletId;
        const noteValue = metaWalletId ? buildTransferNote(baseNote, metaWalletId) : baseNote || null;

        await updateTransaction(editingRecord.transactionId, {
          amount: amountValue,
          type: 'INCOME',
          note: noteValue,
        });

        if (metaWalletId) {
          const sourceTransactions = await getTransactions({
            walletId: metaWalletId,
            fromDate: editingRecord.date,
            toDate: editingRecord.date,
            page: 0,
            size: 50,
          });
          const metaToken = `[saving-transfer:walletId=${metaWalletId};savingId=${savingId}]`;
          const paired = sourceTransactions.find(
            (item) => item.amount === editingRecord.amount && (item.note || '').includes(metaToken),
          );
          if (paired) {
            await updateTransaction(paired.transactionId, {
              amount: amountValue,
              type: 'EXPENSE',
              note: noteValue,
            });
          }
        }
      } else {
        const baseNote = formNote.trim() || saving?.title || '';
        const dateValue = formDate || toIsoDate(new Date());
        let savingNote: string | null = baseNote || null;

        if (transferFromWallet && selectedSourceWalletId) {
          const expenseCategoryId = await ensureSavingCategoryId('EXPENSE');
          const transferNote = buildTransferNote(baseNote, selectedSourceWalletId);
          await createTransaction({
            walletId: selectedSourceWalletId,
            categoryId: expenseCategoryId,
            amount: amountValue,
            type: 'EXPENSE',
            note: transferNote,
            date: dateValue,
          });
          savingNote = transferNote;
        }

        await createTransaction({
          walletId: saving.walletId,
          categoryId: incomeCategoryId,
          amount: amountValue,
          type: 'INCOME',
          note: savingNote,
          date: dateValue,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
      await queryClient.invalidateQueries({ queryKey: ['savings'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions-all-for-budgets'] });
      await queryClient.invalidateQueries({ queryKey: ['saving-transactions', savingId] });
      await queryClient.invalidateQueries({ queryKey: ['saving-period-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['saving-activity', savingId] });

      resetRecordForm();
      setShowAddRecordModal(false);
      Alert.alert('Thành công', recordModalMode === 'edit' ? 'Đã cập nhật giao dịch.' : 'Đã thêm giao dịch tiết kiệm.');
    } catch {
      Alert.alert('Lỗi', recordModalMode === 'edit' ? 'Không thể cập nhật giao dịch.' : 'Không thể thêm giao dịch tiết kiệm. Vui lòng thử lại.');
    }
  };

  const confirmDeleteRecord = () => {
    if (!editingRecord) {
      return;
    }
    Alert.alert('Xóa bản ghi', 'Bạn có chắc chắn muốn xóa bản ghi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const metaWalletId = editingTransferWalletId;
            if (metaWalletId) {
              const sourceTransactions = await getTransactions({
                walletId: metaWalletId,
                fromDate: editingRecord.date,
                toDate: editingRecord.date,
                page: 0,
                size: 50,
              });
              const metaToken = `[saving-transfer:walletId=${metaWalletId};savingId=${savingId}]`;
              const paired = sourceTransactions.find(
                (item) => item.amount === editingRecord.amount && (item.note || '').includes(metaToken),
              );
              if (paired) {
                await deleteTransaction(paired.transactionId);
              }
            }

            await deleteTransaction(editingRecord.transactionId);

            await queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
            await queryClient.invalidateQueries({ queryKey: ['savings'] });
            await queryClient.invalidateQueries({ queryKey: ['wallets'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions-all-for-budgets'] });
            await queryClient.invalidateQueries({ queryKey: ['saving-transactions', savingId] });
            await queryClient.invalidateQueries({ queryKey: ['saving-period-transactions'] });
            await queryClient.invalidateQueries({ queryKey: ['saving-activity', savingId] });

            resetRecordForm();
            setShowAddRecordModal(false);
            Alert.alert('Thành công', 'Đã xóa bản ghi.');
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa bản ghi. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton to="/(tabs)/tools/savings" />
          <Text style={styles.title}>{saving?.title || 'Tiết kiệm'}</Text>
          <Pressable onPress={() => router.replace('/(tabs)/tools/savings')}>
            <X size={22} color="#1f1f1f" />
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
            {savingType === 'one_time' && targetDateObj ? (
              <View style={[styles.tagChip, { backgroundColor: daysRemaining !== null && daysRemaining <= 3 ? '#ffebee' : '#e8f4fd' }]}>
                <Text style={[styles.tagText, { color: daysRemaining !== null && daysRemaining <= 3 ? '#d32f2f' : '#1976d2' }]}>
                  {daysRemaining !== null && daysRemaining > 0
                    ? `Còn ${daysRemaining} ngày`
                    : daysRemaining === 0
                    ? 'Hôm nay'
                    : 'Đã quá hạn'}
                </Text>
              </View>
            ) : null}
          </View>

          {savingType === 'periodic' ? (
            <View style={styles.periodNavRow}>
              <Pressable style={styles.navBtn} onPress={() => movePeriod(-1)}>
                <ChevronLeft size={18} color="#5a6770" />
              </Pressable>
              <View style={styles.periodChip}>
                <Text style={styles.periodChipText}>{formatPeriodChip(periodUnit, periodAnchor)}</Text>
              </View>
              <Pressable style={styles.navBtn} onPress={() => movePeriod(1)}>
                <ChevronRight size={18} color="#5a6770" />
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
          <Wallet size={18} color="#2bb6c2" />
          <Text style={styles.totalText}>Tổng đã tiết kiệm (toàn thời gian)</Text>
          <Text style={styles.totalAmount}>{formatVndAmount(totalSaved)}</Text>
        </View>

        {savingType === 'periodic' ? (
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabButton, activeTab === 'activity' && styles.tabButtonActive]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Hoạt động</Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Thống kê</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động</Text>
            <Text style={styles.sectionCount}>{activityItems.length} mục</Text>
          </View>
        )}

        {savingType !== 'periodic' || activeTab === 'activity' ? (
          <>
            {savingType === 'periodic' && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hoạt động</Text>
                <Text style={styles.sectionCount}>{activityItems.length} mục</Text>
              </View>
            )}

            {activityItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Chưa có hồ sơ nào. Nhấn + để thêm giao dịch của bạn.</Text>
              </View>
            ) : (
              activityItems.reduce((groups: Array<{ date: string; items: Transaction[] }>, item) => {
                const last = groups[groups.length - 1];
                if (!last || last.date !== item.date) {
                  groups.push({ date: item.date, items: [item] });
                } else {
                  last.items.push(item);
                }
                return groups;
              }, []).map((group) => (
            <View key={group.date} style={styles.activityGroup}>
              <Text style={styles.activityDate}>{formatActivityDate(group.date)}</Text>
              {group.items.map((item) => {
                const meta = getTransferMeta(item.note);
                const sourceWallet = meta?.walletId
                  ? wallets.find((wallet) => wallet.walletId === meta.walletId)
                  : null;
                const noteValue = stripTransferMeta(item.note) || 'Giao dịch tiết kiệm';
                const categoryType = normalizeCategoryType(categoryMap.get(item.categoryId)?.type);
                const isExpense = categoryType === 'EXPENSE';

                return (
                  <Pressable
                    key={item.transactionId}
                    style={styles.activityItem}
                    onPress={() => openEditRecordModal(item)}
                  >
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{noteValue}</Text>
                      {meta?.walletId ? (
                        <View style={styles.activitySubRow}>
                          <Wallet size={14} color="#7b8891" />
                          <Text style={styles.activitySubtitle}>{sourceWallet?.name || 'Ví khác'}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[styles.activityAmount, isExpense ? styles.activityAmountExpense : styles.activityAmountIncome]}
                    >
                      {isExpense ? '▼ ' : '▲ '}
                      {formatVndAmount(item.amount)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        </>
        ) : null}

        {savingType === 'periodic' && activeTab === 'stats' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Tiến độ theo kỳ</Text>

            <View style={styles.chartContainer}>
              {chartData.map((data, index) => {
                const heightPercent = maxChartValue > 0 ? Math.max(0, Math.min((data.total / maxChartValue) * 100, 100)) : 0;
                const targetPercent = maxChartValue > 0 ? Math.max(0, Math.min((targetAmount / maxChartValue) * 100, 100)) : 0;
                const isReached = data.total >= targetAmount;

                return (
                  <View key={index} style={styles.chartColumn}>
                    <Text style={styles.chartValueText} numberOfLines={1} adjustsFontSizeToFit>
                      {data.total > 0 ? formatShortAmount(data.total) : '0'}
                    </Text>
                    <View style={styles.chartBarBackground}>
                      <View style={[styles.chartTargetLine, { bottom: `${targetPercent}%` }]} />
                      <View style={[styles.chartBarFill, { height: `${heightPercent}%`, backgroundColor: isReached ? '#2bb6c2' : '#81C784' }]} />
                    </View>
                    <Text style={styles.chartLabelText}>{data.label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLegendRow}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendColor, { backgroundColor: '#81C784' }]} />
                <Text style={styles.chartLegendText}>Đang gom</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendColor, { backgroundColor: '#2bb6c2' }]} />
                <Text style={styles.chartLegendText}>Đạt mục tiêu</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendColor, { backgroundColor: '#ff9800', height: 2 }]} />
                <Text style={styles.chartLegendText}>Mục tiêu</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', right: 16, bottom: 18, flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
        <Pressable
          style={[styles.addRecordButton, { position: 'relative', right: 0, bottom: 0, backgroundColor: '#e57373' }]}
          onPress={openWithdrawModal}
        >
          <Text style={styles.addRecordButtonText}>Rút tiền</Text>
        </Pressable>
        <Pressable
          style={[styles.addRecordButton, { position: 'relative', right: 0, bottom: 0 }]}
          onPress={openCreateRecordModal}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.addRecordButtonText}>Thêm bản ghi</Text>
        </Pressable>
      </View>

      <Modal
        visible={showAddRecordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddRecordModal(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {recordModalMode === 'edit' ? 'Chỉnh sửa hồ sơ tiết kiệm' : 'Thêm hồ sơ tiết kiệm'}
              </Text>
              <Pressable onPress={() => setShowAddRecordModal(false)}>
                <X size={24} color="#333" />
              </Pressable>
            </View>

            {recordModalMode === 'create' ? (
              <Text style={styles.modalSubtitle}>Thêm hồ sơ để tăng số tiền tiết kiệm của bạn.</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Mục/Ghi chú"
              value={formNote}
              onChangeText={setFormNote}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền"
              keyboardType="numeric"
              value={formAmount}
              onChangeText={(value) => setFormAmount(formatMoneyInput(value))}
            />

            <Text style={styles.modalLabel}>Ngày</Text>
            <Pressable
              style={[styles.input, recordModalMode === 'edit' ? styles.inputDisabled : null, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => {
                if (recordModalMode !== 'edit') {
                  setShowDatePicker(true);
                }
              }}
            >
              <Text style={{ fontSize: 15, color: recordModalMode === 'edit' ? colors.textSecondary : colors.textPrimary }}>
                {formDate}
              </Text>
              <Calendar size={18} color={recordModalMode === 'edit' ? colors.textSecondary : '#3a464e'} />
            </Pressable>

            {recordModalMode === 'create' ? (
              <>
                <Text style={styles.modalLabel}>Từ ví (bắt buộc)</Text>
                    <View style={styles.walletChipRow}>
                      {regularWallets.length === 0 ? (
                        <View style={styles.emptyWalletChip}>
                          <Text style={styles.emptyWalletText}>Chưa có ví thường để chuyển.</Text>
                        </View>
                      ) : (
                        regularWallets.map((wallet) => {
                          const selected = wallet.walletId === selectedSourceWalletId;
                          return (
                            <Pressable
                              key={wallet.walletId}
                              style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                              onPress={() => setSelectedSourceWalletId(wallet.walletId)}
                            >
                              <Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                                {wallet.name}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}
                    </View>
              </>
            ) : null}

            {recordModalMode === 'edit' && editingTransferWalletId ? (
              <>
                <Text style={styles.modalLabel}>Từ ví</Text>
                <View style={styles.walletChipRow}>
                  <View style={[styles.walletChip, styles.walletChipActive]}>
                    <Text style={[styles.walletChipText, styles.walletChipTextActive]}>
                      {wallets.find((wallet) => wallet.walletId === editingTransferWalletId)?.name || 'Ví'}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            <Button
              title={recordModalMode === 'edit' ? 'Lưu' : 'Lưu'}
              onPress={submitAddRecord}
              variant="primary"
              loading={false}
            />

            {recordModalMode === 'edit' ? (
              <Button
                title="Xóa bản ghi"
                onPress={confirmDeleteRecord}
                variant="danger"
              />
            ) : null}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={new Date(formDate)}
        title="Chọn ngày"
        onConfirm={(date) => {
          setFormDate(toIsoDate(date));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền tiết kiệm</Text>
              <Pressable onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Rút tiền từ quỹ tiết kiệm về ví của bạn.</Text>

            <TextInput
              style={styles.input}
              placeholder="Ghi chú (Tùy chọn)"
              value={withdrawNote}
              onChangeText={setWithdrawNote}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Số tiền"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={(value) => setWithdrawAmount(formatMoneyInput(value))}
              />
              <Button
                title="Rút toàn bộ"
                onPress={() => setWithdrawAmount(formatMoneyInput(totalSaved))}
                variant="secondary"
              />
            </View>

            <Text style={styles.modalLabel}>Ngày rút</Text>
            <Pressable
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setShowWithdrawDatePicker(true)}
            >
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>
                {withdrawDate}
              </Text>
              <Calendar size={18} color="#3a464e" />
            </Pressable>

            <Text style={styles.modalLabel}>Rút về ví (bắt buộc)</Text>
            <View style={styles.walletChipRow}>
              {regularWallets.length === 0 ? (
                <View style={styles.emptyWalletChip}>
                  <Text style={styles.emptyWalletText}>Chưa có ví thường để nhận.</Text>
                </View>
              ) : (
                regularWallets.map((wallet) => {
                  const selected = wallet.walletId === withdrawTargetWalletId;
                  return (
                    <Pressable
                      key={wallet.walletId}
                      style={[styles.walletChip, selected ? styles.walletChipActive : null]}
                      onPress={() => setWithdrawTargetWalletId(wallet.walletId)}
                    >
                      <Text style={[styles.walletChipText, selected ? styles.walletChipTextActive : null]}>
                        {wallet.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            <Button
              title="Xác nhận rút"
              onPress={submitWithdraw}
              variant="primary"
            />
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerModal
        visible={showWithdrawDatePicker}
        value={new Date(withdrawDate)}
        title="Chọn ngày rút"
        onConfirm={(date) => {
          setWithdrawDate(toIsoDate(date));
          setShowWithdrawDatePicker(false);
        }}
        onCancel={() => setShowWithdrawDatePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e3edf1',
    backgroundColor: colors.backgroundPrimary,
    padding: spacing.md,
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
    color: colors.primary,
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
    color: colors.textSecondary,
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
    color: colors.primary,
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
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#edf1f4',
  },
  totalCard: {
    borderRadius: 16,
    backgroundColor: colors.backgroundPrimary,
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
    color: colors.textPrimary,
  },
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: colors.backgroundPrimary,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e4edf0',
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addRecordButton: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2a6b84',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  addRecordButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d4a53',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#f2f5f7',
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5963',
  },
  toggleButtonTextActive: {
    color: colors.textInverse,
  },
  walletChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  walletChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    backgroundColor: colors.backgroundPrimary,
  },
  walletChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#e7f7f9',
  },
  walletChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d4a53',
  },
  walletChipTextActive: {
    color: colors.primaryDark,
  },
  emptyWalletChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8ec',
    backgroundColor: '#f6f9fb',
  },
  emptyWalletText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recordFormSection: {
    marginBottom: 20,
  },
  recordFormLabel: {
    fontSize: 14,
    color: '#4b5963',
    fontWeight: '500',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: '#e8ecef',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a6770',
  },
  tabTextActive: {
    color: '#1f1f1f',
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 24,
    marginBottom: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartValueText: {
    fontSize: 10,
    color: '#7b8891',
    marginBottom: 6,
    height: 14,
  },
  chartBarBackground: {
    width: 24,
    flex: 1,
    backgroundColor: '#f5f7f9',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  chartTargetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ff9800',
    zIndex: 1,
  },
  chartLabelText: {
    fontSize: 12,
    color: '#5a6770',
    marginTop: 8,
    fontWeight: '500',
    height: 16,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  chartLegendText: {
    fontSize: 12,
    color: '#5a6770',
  },
  activityGroup: {
    gap: 8,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activityItem: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityInfo: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activitySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityAmountIncome: {
    color: colors.success,
  },
  activityAmountExpense: {
    color: colors.error,
  },
});
