import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { Button, BackButton, colors, spacing } from '@/components/common';
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

const sumSignedAmount = (items: Array<{ categoryId: string; amount: number }>, categoryMap: Map<string, { type?: string }>) =>
  items.reduce((sum, item) => {
    const type = normalizeCategoryType(categoryMap.get(item.categoryId)?.type);
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
  const [recordModalMode, setRecordModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<Transaction | null>(null);
  const [editingTransferWalletId, setEditingTransferWalletId] = useState<string | null>(null);

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
  const totalSaved = Number(saving?.currentBalance || 0);
  const targetAmount = saving?.targetAmount ?? 0;
  const progressValue = savingType === 'periodic' ? periodSaved : totalSaved;
  const percent = targetAmount > 0 ? Math.min((progressValue / targetAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(targetAmount - progressValue, 0);

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

  const isSavingCategoryName = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'tiết kiệm' || normalized === 'tiet kiem';
  };

  const ensureSavingCategoryId = async (type: 'INCOME' | 'EXPENSE') => {
    const existing = categories.find(
      (item) => normalizeCategoryType(item.type) === type && isSavingCategoryName(item.name),
    );
    if (existing) {
      return existing.categoryId;
    }
    const created = await createCategory({
      name: 'Tiết kiệm',
      type,
      icon: '🏦',
      color: '#BFEFF3',
    });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    return created.categoryId;
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
            note: transferNote,
            date: dateValue,
          });
          savingNote = transferNote;
        }

        await createTransaction({
          walletId: saving.walletId,
          categoryId: incomeCategoryId,
          amount: amountValue,
          note: savingNote,
          date: dateValue,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
      await queryClient.invalidateQueries({ queryKey: ['savings'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
          <Text style={styles.sectionCount}>{activityItems.length} mục</Text>
        </View>
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
                          <Ionicons name="wallet-outline" size={14} color="#7b8891" />
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
      </ScrollView>

      <Pressable style={styles.addRecordButton} onPress={openCreateRecordModal}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.addRecordButtonText}>Thêm bản ghi</Text>
      </Pressable>

      <Modal
        visible={showAddRecordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {recordModalMode === 'edit' ? 'Chỉnh sửa hồ sơ tiết kiệm' : 'Thêm hồ sơ tiết kiệm'}
              </Text>
              <Pressable onPress={() => setShowAddRecordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
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
            <TextInput
              style={[styles.input, recordModalMode === 'edit' ? styles.inputDisabled : null]}
              placeholder="YYYY-MM-DD"
              value={formDate}
              onChangeText={setFormDate}
              editable={recordModalMode !== 'edit'}
            />

            {recordModalMode === 'create' ? (
              <>
                <Text style={styles.modalLabel}>Bạn có muốn chuyển hồ sơ tiết kiệm này từ ví không?</Text>
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[styles.toggleButton, transferFromWallet ? styles.toggleButtonActive : null]}
                    onPress={() => setTransferFromWallet(true)}
                  >
                    <Text style={[styles.toggleButtonText, transferFromWallet ? styles.toggleButtonTextActive : null]}>
                      Có
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleButton, !transferFromWallet ? styles.toggleButtonActive : null]}
                    onPress={() => setTransferFromWallet(false)}
                  >
                    <Text style={[styles.toggleButtonText, !transferFromWallet ? styles.toggleButtonTextActive : null]}>
                      Không
                    </Text>
                  </Pressable>
                </View>

                {transferFromWallet ? (
                  <>
                    <Text style={styles.modalLabel}>Từ ví</Text>
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
      </Modal>
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
