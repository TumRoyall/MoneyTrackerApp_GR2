import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, DatePickerModal } from '@/components/common';

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

import { useDebtUsecases } from '@/modules/debt/usecases';
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/money';

export const DebtEditScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ debtId?: string }>();
  const debtId = params.debtId || '';
  const queryClient = useQueryClient();

  const { getDebt, updateDebt, deleteDebt } = useDebtUsecases();

  const debtQuery = useQuery({
    queryKey: ['debt', debtId],
    queryFn: () => getDebt(debtId),
    enabled: Boolean(debtId),
  });

  const debt = debtQuery.data;

  const [titleInput, setTitleInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currency, setCurrency] = useState('');
  
  const [paymentTypeInput, setPaymentTypeInput] = useState('ONE_TIME');
  const [periodUnitInput, setPeriodUnitInput] = useState('MONTHLY');
  const [enableInterest, setEnableInterest] = useState(false);
  const [interestTypeInput, setInterestTypeInput] = useState('SIMPLE');
  const [interestRateInput, setInterestRateInput] = useState('');
  
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!debt || hasInitialized) {
      return;
    }
    setTitleInput(debt.title ?? '');
    setTargetInput(formatMoneyInput(String(debt.targetAmount ?? 0)));
    setTargetDateInput(debt.targetDate ?? '');
    setCurrency(debt.currency ?? '');
    
    setPaymentTypeInput(debt.paymentType || 'ONE_TIME');
    setPeriodUnitInput(debt.periodUnit || 'MONTHLY');
    setEnableInterest(!!debt.interestRate);
    setInterestTypeInput(debt.interestType && debt.interestType !== 'NONE' ? debt.interestType : 'SIMPLE');
    setInterestRateInput(debt.interestRate ? String(debt.interestRate) : '');
    
    setHasInitialized(true);
  }, [debt, hasInitialized]);

  const saveHandler = async () => {
    if (!debtId) {
      Alert.alert('Lỗi', 'Không tìm thấy món nợ.');
      return;
    }
    const targetAmount = parseMoneyInput(targetInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề món nợ.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    try {
      await updateDebt(debtId, {
        title: titleInput.trim(),
        targetAmount,
        targetDate: targetDateInput.trim() || undefined,
        paymentType: paymentTypeInput,
        periodUnit: paymentTypeInput === 'PERIODIC' ? periodUnitInput : undefined,
        interestRate: enableInterest && interestRateInput ? parseFloat(interestRateInput) : undefined,
        interestType: enableInterest ? interestTypeInput : 'NONE',
      });
      await queryClient.invalidateQueries({ queryKey: ['debts'] });
      await queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      Alert.alert('Thành công', 'Đã cập nhật món nợ.');
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật món nợ. Vui lòng thử lại.');
    }
  };

  const confirmDelete = () => {
    if (!debtId) {
      return;
    }
    Alert.alert('Xóa món nợ', 'Bạn có chắc chắn muốn xóa món nợ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDebt(debtId);
            await queryClient.invalidateQueries({ queryKey: ['debts'] });
            Alert.alert('Thành công', 'Đã xóa món nợ.');
            router.back();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa món nợ. Vui lòng thử lại.');
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
          <Text style={styles.title}>Chỉnh sửa món nợ</Text>
          <View style={{ width: 24 }} />
        </View>

        {debtQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải món nợ...</Text>
          </View>
        ) : !debt ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Không tìm thấy món nợ.</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Tiền tệ"
              value={currency}
              editable={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền nợ"
              keyboardType="numeric"
              value={targetInput}
              onChangeText={(value) => setTargetInput(formatMoneyInput(value))}
            />
            <Pressable
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: targetDateInput ? '#1f1f1f' : '#6c7a84' }}>
                {targetDateInput ? formatDisplayDate(targetDateInput) : 'Ngày mục tiêu'}
              </Text>
            </Pressable>

            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Hình thức trả nợ</Text>
              <View style={styles.radioRow}>
                <Pressable
                  style={[styles.radioBtn, paymentTypeInput === 'ONE_TIME' && styles.radioBtnActive]}
                  onPress={() => setPaymentTypeInput('ONE_TIME')}
                >
                  <Text style={[styles.radioText, paymentTypeInput === 'ONE_TIME' && styles.radioTextActive]}>Trả 1 lần</Text>
                </Pressable>
                <Pressable
                  style={[styles.radioBtn, paymentTypeInput === 'PERIODIC' && styles.radioBtnActive]}
                  onPress={() => setPaymentTypeInput('PERIODIC')}
                >
                  <Text style={[styles.radioText, paymentTypeInput === 'PERIODIC' && styles.radioTextActive]}>Trả góp (kỳ)</Text>
                </Pressable>
              </View>
            </View>

            {paymentTypeInput === 'PERIODIC' && (
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Chu kỳ trả nợ</Text>
                <View style={styles.radioRow}>
                  {['WEEKLY', 'MONTHLY', 'YEARLY'].map((unit) => (
                    <Pressable
                      key={unit}
                      style={[styles.radioBtn, periodUnitInput === unit && styles.radioBtnActive]}
                      onPress={() => setPeriodUnitInput(unit)}
                    >
                      <Text style={[styles.radioText, periodUnitInput === unit && styles.radioTextActive]}>
                        {unit === 'WEEKLY' ? 'Tuần' : unit === 'MONTHLY' ? 'Tháng' : 'Năm'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.optionGroup}>
              <View style={[styles.radioRow, { justifyContent: 'space-between', paddingVertical: 8 }]}>
                <Text style={styles.optionLabel}>Tính lãi suất</Text>
                <Switch value={enableInterest} onValueChange={setEnableInterest} />
              </View>
            </View>

            {enableInterest && (
              <>
                <View style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>Loại lãi suất</Text>
                  <View style={styles.radioRow}>
                    <Pressable
                      style={[styles.radioBtn, interestTypeInput === 'SIMPLE' && styles.radioBtnActive]}
                      onPress={() => setInterestTypeInput('SIMPLE')}
                    >
                      <Text style={[styles.radioText, interestTypeInput === 'SIMPLE' && styles.radioTextActive]}>Lãi đơn</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.radioBtn, interestTypeInput === 'COMPOUND' && styles.radioBtnActive]}
                      onPress={() => setInterestTypeInput('COMPOUND')}
                    >
                      <Text style={[styles.radioText, interestTypeInput === 'COMPOUND' && styles.radioTextActive]}>Lãi kép</Text>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Lãi suất (% / năm)"
                  keyboardType="numeric"
                  value={interestRateInput}
                  onChangeText={setInterestRateInput}
                />
              </>
            )}

            <Pressable style={styles.saveBtn} onPress={saveHandler}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </Pressable>

            <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteBtnText}>Xóa nợ</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={targetDateInput ? new Date(targetDateInput) : new Date()}
        title="Chọn ngày mục tiêu"
        onConfirm={(date) => {
          setTargetDateInput(toIsoDate(date));
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
  emptyCard: {
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6ecef',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#667179',
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
  deleteBtn: {
    backgroundColor: '#f25c64',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radioBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  radioBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#eff6ff',
  },
  radioText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
