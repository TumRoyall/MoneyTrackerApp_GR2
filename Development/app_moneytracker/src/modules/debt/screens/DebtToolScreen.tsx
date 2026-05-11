import { useMemo, useState } from 'react';
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

import { useDebtUsecases } from '@/modules/debt/usecases';
import { Debt } from '@/modules/debt/models/debt.types';
import { formatMoneyInput, formatVndAmount, parseMoneyInput } from '@/shared/utils/money';

const currencyOptions = ['VND', 'USD', 'EUR'];

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const buildProgress = (debt: Debt) => {
  const totalPaid = Number(debt.currentBalance || 0);
  const target = Number(debt.targetAmount || 0);
  const percent = target > 0 ? Math.min((totalPaid / target) * 100, 100) : 0;
  return { totalPaid, target, percent };
};

export const DebtToolScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getDebts, createDebt } = useDebtUsecases();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [targetDateInput, setTargetDateInput] = useState(toIsoDate(new Date()));
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  const debtsQuery = useQuery({
    queryKey: ['debts'],
    queryFn: getDebts,
  });

  const debts = debtsQuery.data ?? [];

  const totalPaidAllTime = useMemo(
    () => debts.reduce((sum, debt) => sum + Number(debt.currentBalance || 0), 0),
    [debts],
  );

  const filteredDebts = useMemo(() => {
    if (!hideCompleted) {
      return debts;
    }
    return debts.filter((debt) => {
      const paid = Number(debt.currentBalance || 0);
      return paid < debt.targetAmount;
    });
  }, [debts, hideCompleted]);

  const createDebtHandler = async () => {
    const targetAmount = parseMoneyInput(targetInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề món nợ.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }
    if (!targetDateInput.trim()) {
      Alert.alert('Thiếu ngày mục tiêu', 'Vui lòng nhập ngày mục tiêu cho món nợ.');
      return;
    }

    try {
      await createDebt({
        title: titleInput.trim(),
        targetAmount,
        currency,
        startDate: toIsoDate(new Date()),
        targetDate: targetDateInput.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowCreateModal(false);
      setTitleInput('');
      setTargetInput('');
      setCurrency('VND');
      setTargetDateInput(toIsoDate(new Date()));
      Alert.alert('Thành công', 'Đã tạo món nợ mới.');
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo món nợ. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/tools')}>
            <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
          </Pressable>
          <Text style={styles.title}>Món nợ</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ẩn đã hoàn thành</Text>
          <Switch
            value={hideCompleted}
            onValueChange={setHideCompleted}
            trackColor={{ false: '#d4dde3', true: '#33c3cd' }}
            thumbColor={hideCompleted ? '#ffffff' : '#f1f5f8'}
          />
        </View>

        <View style={styles.totalSummaryCard}>
          <Ionicons name="wallet" size={18} color="#2bb6c2" />
          <Text style={styles.totalSummaryText}>Tổng đã trả</Text>
          <Text style={styles.totalSummaryAmount}>{formatVndAmount(totalPaidAllTime)}</Text>
        </View>

        {debtsQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải món nợ...</Text>
          </View>
        ) : filteredDebts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có món nợ</Text>
            <Text style={styles.emptyText}>Hãy tạo món nợ đầu tiên của bạn.</Text>
          </View>
        ) : (
          filteredDebts.map((debt) => {
            const { totalPaid, target, percent } = buildProgress(debt);
            const remaining = Math.max(target - totalPaid, 0);

            return (
              <Pressable
                key={debt.debtId}
                style={styles.debtCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/tools/debts/[debtId]',
                    params: { debtId: debt.debtId },
                  })
                }
              >
                <View style={styles.debtCardHeader}>
                  <Text style={styles.debtTitle}>{debt.title}</Text>
                  <Pressable
                    hitSlop={10}
                    onPress={(event) => {
                      event.stopPropagation();
                      router.push({
                        pathname: '/(tabs)/tools/debts/[debtId]/edit',
                        params: { debtId: debt.debtId },
                      });
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color="#1f1f1f" />
                  </Pressable>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountPrimary}>{formatVndAmount(totalPaid)}</Text>
                  <Text style={styles.amountSecondary}>/ {formatVndAmount(target)}</Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>Thanh toán</Text>
                  </View>
                  <Text style={styles.metaText}>Còn lại: {formatVndAmount(remaining)}</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>Mục tiêu: {formatDisplayDate(debt.targetDate)}</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                  <View style={styles.progressBubble}>
                    <Text style={styles.progressBubbleText}>{`${Math.round(percent)}%`}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Thêm món nợ</Text>
      </Pressable>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo thanh toán nợ</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Theo dõi và quản lý tiến trình thanh toán nợ của bạn.</Text>

            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <View style={styles.dropdownWrapper}>
              <Pressable
                style={styles.dropdownInput}
                onPress={() => setShowCurrencyDropdown((current) => !current)}
              >
                <Text style={styles.dropdownText}>Tiền tệ - {currency}</Text>
                <Ionicons name={showCurrencyDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#3a464e" />
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

            <TextInput
              style={styles.input}
              placeholder="Số tiền nợ"
              keyboardType="numeric"
              value={targetInput}
              onChangeText={(value) => setTargetInput(formatMoneyInput(value))}
            />

            <TextInput
              style={styles.input}
              placeholder="Ngày mục tiêu (YYYY-MM-DD)"
              value={targetDateInput}
              onChangeText={setTargetDateInput}
            />

            <Text style={styles.noteText}>Ví nợ sẽ được tạo tự động với tên món nợ.</Text>

            <Pressable style={styles.saveBtn} onPress={createDebtHandler}>
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
    gap: 14,
    paddingBottom: 24,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#3b4b54',
    fontWeight: '600',
  },
  totalSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4edf0',
  },
  totalSummaryText: {
    flex: 1,
    fontSize: 13,
    color: '#4d5b64',
  },
  totalSummaryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ecef',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
  },
  debtCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e3edf1',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  debtCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  editButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountPrimary: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  amountSecondary: {
    fontSize: 14,
    color: '#7a8790',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7780',
  },
  typeChip: {
    backgroundColor: '#f0f6f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2a6b84',
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#ecf1f4',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2bb6c2',
  },
  progressBubble: {
    position: 'absolute',
    right: 8,
    top: -18,
    backgroundColor: '#2bb6c2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  progressBubbleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
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
  fabText: {
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
    color: '#7b8891',
  },
  saveBtn: {
    backgroundColor: '#22b8c8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
