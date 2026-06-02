import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

import { Button, Card, FAB, EmptyState, ProgressBar, Switch, BackButton, colors, spacing, typography } from '@/components/common';
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
          <BackButton to="/(tabs)/tools" />
          <Text style={styles.title}>Món nợ</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ẩn đã hoàn thành</Text>
          <Switch value={hideCompleted} onValueChange={setHideCompleted} />
        </View>

        <Card variant="elevated" style={styles.totalSummaryCard}>
          <View style={styles.totalSummaryContent}>
            <Ionicons name="wallet" size={18} color={colors.primary} />
            <Text style={styles.totalSummaryText}>Tổng đã trả</Text>
            <Text style={styles.totalSummaryAmount}>{formatVndAmount(totalPaidAllTime)}</Text>
          </View>
        </Card>

        {debtsQuery.isLoading ? (
          <EmptyState
            icon="📊"
            title="Đang tải món nợ..."
            description="Vui lòng đợi trong giây lát."
          />
        ) : filteredDebts.length === 0 ? (
          <EmptyState
            icon="💳"
            title="Chưa có món nợ"
            description="Hãy tạo món nợ đầu tiên của bạn."
            action={{
              title: 'Tạo món nợ',
              onPress: () => setShowCreateModal(true),
            }}
          />
        ) : (
          filteredDebts.map((debt) => {
            const { totalPaid, target, percent } = buildProgress(debt);
            const remaining = Math.max(target - totalPaid, 0);

            return (
              <Card
                key={debt.debtId}
                variant="elevated"
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

                <ProgressBar value={percent} showLabel />
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon={<Ionicons name="add" size={24} color="#fff" />}
        label="Thêm món nợ"
        onPress={() => setShowCreateModal(true)}
      />

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

            <Button title="Lưu" onPress={createDebtHandler} style={styles.saveBtn} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 24,
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
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalSummaryCard: {
    padding: spacing.md,
  },
  totalSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalSummaryText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalSummaryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  debtCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  debtCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.text,
  },
  amountSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  dropdownInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  dropdownText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 6,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
});
