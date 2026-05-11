import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
  const [currency, setCurrency] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!debt || hasInitialized) {
      return;
    }
    setTitleInput(debt.title ?? '');
    setTargetInput(formatMoneyInput(String(debt.targetAmount ?? 0)));
    setTargetDateInput(debt.targetDate ?? '');
    setCurrency(debt.currency ?? '');
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
            <TextInput
              style={styles.input}
              placeholder="Ngày mục tiêu (YYYY-MM-DD)"
              value={targetDateInput}
              onChangeText={setTargetDateInput}
            />

            <Pressable style={styles.saveBtn} onPress={saveHandler}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </Pressable>

            <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteBtnText}>Xóa nợ</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
});
