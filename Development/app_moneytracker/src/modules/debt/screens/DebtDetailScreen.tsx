import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

import { useDebtUsecases } from '@/modules/debt/usecases';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { useTransactionUsecases } from '@/modules/transaction/usecases';
import { Transaction } from '@/modules/transaction/models/transaction.types';
import { useWalletUsecases } from '@/modules/wallet/usecases';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

const normalizeCategoryType = (value: unknown) => String(value || '').toUpperCase();

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return 'Chưa đặt';
  }
  const [year, month, day] = value.split('-').map((item) => Number(item));
  if (!year || !month || !day) {
    return value;
  }
  return `${day} thg ${month}, ${year}`;
};

const calculateDaysRemaining = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map((item) => Number(item));
  if (!year || !month || !day) {
    return null;
  }
  const target = new Date(year, month - 1, day);
  const diffMs = target.getTime() - new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
};

const transferMetaRegex = /\[debt-payment:walletId=([^;\]]+);debtId=([^\]]+)\]/;

const getTransferMeta = (note?: string | null) => {
  if (!note) {
    return null;
  }
  const match = note.match(transferMetaRegex);
  if (!match) {
    return null;
  }
  return { walletId: match[1], debtId: match[2] };
};

const stripTransferMeta = (note?: string | null) => {
  if (!note) {
    return '';
  }
  return note.replace(transferMetaRegex, '').trim();
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

export const DebtDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ debtId?: string }>();
  const debtId = params.debtId || '';
  const queryClient = useQueryClient();

  const { getDebt } = useDebtUsecases();
  const { getCategories, createCategory } = useCategoryUsecases();
  const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactionUsecases();
  const { getWallets } = useWalletUsecases();

  const debtQuery = useQuery({
    queryKey: ['debt', debtId],
    queryFn: () => getDebt(debtId),
    enabled: Boolean(debtId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
  });

  const debt = debtQuery.data;
  const categories = categoriesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.categoryId, item])),
    [categories],
  );

  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState(true);
  const [selectedSourceWalletId, setSelectedSourceWalletId] = useState<string | null>(null);
  const [formNote, setFormNote] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(toIsoDate(new Date()));
  const [recordModalMode, setRecordModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<Transaction | null>(null);
  const [editingTransferWalletId, setEditingTransferWalletId] = useState<string | null>(null);

  const transactionsQuery = useQuery({
    queryKey: ['debt-activity', debtId],
    queryFn: () =>
      getTransactions({
        walletId: debt?.walletId ?? undefined,
        page: 0,
        size: 200,
        sort: 'date,desc',
      }),
    enabled: Boolean(debt?.walletId),
  });

  const activityItems = transactionsQuery.data ?? [];

  const totalPaid = Number(debt?.currentBalance || 0);
  const targetAmount = debt?.targetAmount ?? 0;
  const percent = targetAmount > 0 ? Math.min((totalPaid / targetAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(targetAmount - totalPaid, 0);

  const startDateValue = debt?.startDate || debt?.createdAt?.slice(0, 10) || null;
  const targetDateValue = debt?.targetDate || null;
  const remainingDays = calculateDaysRemaining(targetDateValue);

  const regularWallets = useMemo(
    () =>
      wallets.filter((wallet) => {
        const type = String(wallet.type || '').toUpperCase();
        if (wallet.walletId === debt?.walletId) {
          return false;
        }
        return type === 'REGULAR' || type === 'CASH';
      }),
    [wallets, debt?.walletId],
  );

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

  const isDebtCategoryName = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'nợ' || normalized === 'no';
  };

  const ensureDebtCategoryId = async (type: 'INCOME' | 'EXPENSE') => {
    const existing = categories.find(
      (item) => normalizeCategoryType(item.type) === type && isDebtCategoryName(item.name),
    );
    if (existing) {
      return existing.categoryId;
    }
    const created = await createCategory({
      name: 'Nợ',
      type,
      icon: '💳',
      color: '#FBE8E6',
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
    const metaToken = `[debt-payment:walletId=${sourceWalletId};debtId=${debtId}]`;
    if (!baseNote.trim()) {
      return metaToken;
    }
    return `${baseNote.trim()} ${metaToken}`;
  };

  const submitAddRecord = async () => {
    if (!debt?.walletId) {
      Alert.alert('Thiếu ví', 'Không tìm thấy ví nợ cho khoản này.');
      return;
    }

    const amountValue = parseMoneyInput(formAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (transferFromWallet && !selectedSourceWalletId) {
      Alert.alert('Thiếu ví nguồn', 'Vui lòng chọn ví để thanh toán nợ.');
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
      const incomeCategoryId = await ensureDebtCategoryId('INCOME');

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
          const metaToken = `[debt-payment:walletId=${metaWalletId};debtId=${debtId}]`;
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
        const baseNote = formNote.trim() || debt?.title || '';
        const dateValue = formDate || toIsoDate(new Date());
        let debtNote: string | null = baseNote || null;

        if (transferFromWallet && selectedSourceWalletId) {
          const expenseCategoryId = await ensureDebtCategoryId('EXPENSE');
          const transferNote = buildTransferNote(baseNote, selectedSourceWalletId);
          await createTransaction({
            walletId: selectedSourceWalletId,
            categoryId: expenseCategoryId,
            amount: amountValue,
            note: transferNote,
            date: dateValue,
          });
          debtNote = transferNote;
        }

        await createTransaction({
          walletId: debt.walletId,
          categoryId: incomeCategoryId,
          amount: amountValue,
          note: debtNote,
          date: dateValue,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      await queryClient.invalidateQueries({ queryKey: ['debts'] });
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['debt-activity', debtId] });

      resetRecordForm();
      setShowAddRecordModal(false);
      Alert.alert('Thành công', recordModalMode === 'edit' ? 'Đã cập nhật bản ghi.' : 'Đã thêm thanh toán nợ.');
    } catch {
      Alert.alert('Lỗi', recordModalMode === 'edit' ? 'Không thể cập nhật bản ghi.' : 'Không thể thêm thanh toán nợ. Vui lòng thử lại.');
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
              const metaToken = `[debt-payment:walletId=${metaWalletId};debtId=${debtId}]`;
              const paired = sourceTransactions.find(
                (item) => item.amount === editingRecord.amount && (item.note || '').includes(metaToken),
              );
              if (paired) {
                await deleteTransaction(paired.transactionId);
              }
            }

            await deleteTransaction(editingRecord.transactionId);

            await queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
            await queryClient.invalidateQueries({ queryKey: ['debts'] });
            await queryClient.invalidateQueries({ queryKey: ['wallets'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            await queryClient.invalidateQueries({ queryKey: ['debt-activity', debtId] });

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
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>{debt?.title || 'Món nợ'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#1f1f1f" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.progressWrap}>
            <ProgressRing size={180} strokeWidth={14} percent={percent} />
            <View style={styles.progressCenter}>
              <Text style={styles.percentText}>{`${Math.round(percent)}%`}</Text>
              <Text style={styles.percentCaption}>đã trả</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Đã trả</Text>
              <Text style={styles.statValue}>{formatVndAmount(totalPaid)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Còn lại</Text>
              <Text style={styles.statValue}>{formatVndAmount(remainingAmount)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng</Text>
              <Text style={styles.statValue}>{formatVndAmount(targetAmount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateChip}>
            <Ionicons name="flag-outline" size={14} color="#6c7a84" />
            <Text style={styles.dateLabel}>Đã bắt đầu</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(startDateValue)}</Text>
          </View>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color="#6c7a84" />
            <Text style={styles.dateLabel}>Mục tiêu</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(targetDateValue)}</Text>
          </View>
        </View>

        <View style={styles.dateChipWide}>
          <Ionicons name="time-outline" size={16} color="#6c7a84" />
          <Text style={styles.dateLabel}>Số ngày còn lại</Text>
          <Text style={styles.dateValue}>{remainingDays == null ? '--' : remainingDays}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt động</Text>
          <Text style={styles.sectionCount}>{activityItems.length} mục</Text>
        </View>
        {activityItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Chưa có bản ghi nào. Nhấn + để thêm thanh toán.</Text>
          </View>
        ) : (
          activityItems
            .reduce((groups: Array<{ date: string; items: Transaction[] }>, item) => {
              const last = groups[groups.length - 1];
              if (!last || last.date !== item.date) {
                groups.push({ date: item.date, items: [item] });
              } else {
                last.items.push(item);
              }
              return groups;
            }, [])
            .map((group) => (
              <View key={group.date} style={styles.activityGroup}>
                <Text style={styles.activityDate}>{formatActivityDate(group.date)}</Text>
                {group.items.map((item) => {
                  const meta = getTransferMeta(item.note);
                  const sourceWallet = meta?.walletId
                    ? wallets.find((wallet) => wallet.walletId === meta.walletId)
                    : null;
                  const noteValue = stripTransferMeta(item.note) || 'Thanh toán nợ';
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
                        style={[
                          styles.activityAmount,
                          isExpense ? styles.activityAmountExpense : styles.activityAmountIncome,
                        ]}
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
                {recordModalMode === 'edit' ? 'Chỉnh sửa thanh toán nợ' : 'Thêm thanh toán nợ'}
              </Text>
              <Pressable onPress={() => setShowAddRecordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {recordModalMode === 'create' ? (
              <Text style={styles.modalSubtitle}>Thêm thanh toán để giảm số nợ của bạn.</Text>
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
                <Text style={styles.modalLabel}>Thanh toán nợ từ ví khác?</Text>
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
                    <Text
                      style={[styles.toggleButtonText, !transferFromWallet ? styles.toggleButtonTextActive : null]}
                    >
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

            <Pressable style={styles.saveButton} onPress={submitAddRecord}>
              <Text style={styles.saveButtonText}>Lưu</Text>
            </Pressable>

            {recordModalMode === 'edit' ? (
              <Pressable style={styles.deleteButton} onPress={confirmDeleteRecord}>
                <Text style={styles.deleteButtonText}>Xóa bản ghi</Text>
              </Pressable>
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
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  dateChipWide: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6c7a84',
  },
  dateValue: {
    fontSize: 13,
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
    backgroundColor: '#fff',
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
    color: '#1f1f1f',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7b8891',
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
    color: '#1f1f1f',
  },
  inputDisabled: {
    backgroundColor: '#f2f5f7',
    color: '#7b8891',
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
    backgroundColor: '#fff',
  },
  toggleButtonActive: {
    backgroundColor: '#2bb6c2',
    borderColor: '#2bb6c2',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5963',
  },
  toggleButtonTextActive: {
    color: '#fff',
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
    backgroundColor: '#fff',
  },
  walletChipActive: {
    borderColor: '#2bb6c2',
    backgroundColor: '#e7f7f9',
  },
  walletChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d4a53',
  },
  walletChipTextActive: {
    color: '#179ea9',
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
    color: '#7b8891',
  },
  saveButton: {
    marginTop: 6,
    backgroundColor: '#22b8c8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#f25c64',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  activityGroup: {
    gap: 8,
  },
  activityDate: {
    fontSize: 12,
    color: '#7b8891',
    marginTop: 4,
  },
  activityItem: {
    backgroundColor: '#fff',
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
    color: '#1f1f1f',
  },
  activitySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#7b8891',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityAmountIncome: {
    color: '#24a37a',
  },
  activityAmountExpense: {
    color: '#d85a62',
  },
});
