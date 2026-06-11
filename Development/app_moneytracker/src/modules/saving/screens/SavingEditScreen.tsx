import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { DatePickerModal } from '@/components/common';

import { useSavingUsecases } from '@/modules/saving/usecases';
import { SavingPeriodUnit, SavingType } from '@/modules/saving/models/saving.types';
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/money';

const normalizeSavingType = (value: unknown): SavingType => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'periodic' ? 'periodic' : 'one_time';
};

const normalizePeriodUnit = (value: unknown): SavingPeriodUnit => {
  const stringValue = String(value || '').toLowerCase();
  return stringValue === 'yearly' ? 'yearly' : 'monthly';
};

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SavingEditScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ savingId?: string }>();
  const savingId = params.savingId || '';
  const queryClient = useQueryClient();

  const { getSaving, updateSaving, deleteSaving } = useSavingUsecases();

  const savingQuery = useQuery({
    queryKey: ['saving', savingId],
    queryFn: () => getSaving(savingId),
    enabled: Boolean(savingId),
  });

  const saving = savingQuery.data;

  const [titleInput, setTitleInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [savingType, setSavingType] = useState<SavingType>('periodic');
  const [periodUnit, setPeriodUnit] = useState<SavingPeriodUnit>('monthly');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!saving || hasInitialized) {
      return;
    }
    setTitleInput(saving.title ?? '');
    setTargetInput(formatMoneyInput(String(saving.targetAmount ?? 0)));
    setSavingType(normalizeSavingType(saving.type));
    setPeriodUnit(normalizePeriodUnit(saving.periodUnit));
    if (saving.targetDate) {
      setTargetDate(new Date(saving.targetDate));
    }
    setHasInitialized(true);
  }, [saving, hasInitialized]);

  const saveHandler = async () => {
    if (!savingId) {
      Alert.alert('Lỗi', 'Không tìm thấy mục tiêu tiết kiệm.');
      return;
    }
    const targetAmount = parseMoneyInput(targetInput);
    if (!titleInput.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề mục tiêu.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }
    if (savingType === 'periodic' && !periodUnit) {
      Alert.alert('Thiếu chu kỳ', 'Vui lòng chọn chu kỳ tiết kiệm.');
      return;
    }

    try {
      await updateSaving(savingId, {
        title: titleInput.trim(),
        targetAmount,
        type: savingType,
        periodUnit: savingType === 'periodic' ? periodUnit : undefined,
        targetDate: savingType === 'one_time' ? toIsoDate(targetDate) : undefined,
      });

      if (savingType === 'one_time' && targetDate) {
         const triggerDate = new Date(targetDate);
         triggerDate.setDate(triggerDate.getDate() - 3);
         triggerDate.setHours(9, 0, 0, 0);
         if (triggerDate > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Nhắc nhở Tiết kiệm',
                body: `Mục tiêu "${titleInput.trim()}" của bạn sắp đến hạn vào ngày ${toIsoDate(targetDate)}. Bạn đã đạt mục tiêu chưa?`,
              },
              trigger: triggerDate,
            });
         }
      }

      await queryClient.invalidateQueries({ queryKey: ['savings'] });
      await queryClient.invalidateQueries({ queryKey: ['saving', savingId] });
      Alert.alert('Thành công', 'Đã cập nhật mục tiêu tiết kiệm.');
      router.back();
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.response?.data?.message || '';
      if (msg === 'Wallet name already exists' || msg.includes('exists')) {
        Alert.alert('Tên mục tiêu đã tồn tại', 'Tên này đã được sử dụng (ví tiết kiệm trùng tên). Vui lòng chọn một tên khác.');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật mục tiêu. Vui lòng thử lại.');
      }
    }
  };

  const deleteHandler = () => {
    Alert.alert('Xóa mục tiêu', 'Bạn có chắc chắn muốn xóa mục tiêu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSaving(savingId);
            await queryClient.invalidateQueries({ queryKey: ['savings'] });
            Alert.alert('Thành công', 'Đã xóa mục tiêu tiết kiệm.');
            router.replace('/(tabs)/tools');
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa mục tiêu. Vui lòng thử lại.');
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
          <Text style={styles.title}>Chỉnh sửa tiết kiệm</Text>
          <View style={{ width: 24 }} />
        </View>

        {savingQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Đang tải mục tiêu...</Text>
          </View>
        ) : !saving ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Không tìm thấy mục tiêu tiết kiệm.</Text>
          </View>
        ) : (
          <>
            <View style={styles.typeToggleRow}>
              {(['one_time', 'periodic'] as SavingType[]).map((type) => {
                const selected = savingType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.typeToggleButton, selected ? styles.typeToggleButtonActive : null]}
                    onPress={() => setSavingType(type)}
                  >
                    <Text style={[styles.typeToggleText, selected ? styles.typeToggleTextActive : null]}>
                      {type === 'one_time' ? 'Một lần' : 'Định kỳ'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {savingType === 'periodic' ? (
              <View style={styles.dropdownWrapper}>
                <Pressable
                  style={styles.dropdownInput}
                  onPress={() => setShowPeriodDropdown((current) => !current)}
                >
                  <Text style={styles.dropdownText}>
                    {periodUnit === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                  </Text>
                  <Ionicons name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#3a464e" />
                </Pressable>
                {showPeriodDropdown ? (
                  <View style={styles.dropdownMenu}>
                    {([
                      { value: 'monthly' as SavingPeriodUnit, label: 'Hàng tháng' },
                      { value: 'yearly' as SavingPeriodUnit, label: 'Hàng năm' },
                    ]).map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.dropdownMenuItem}
                        onPress={() => {
                          setPeriodUnit(option.value);
                          setShowPeriodDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownMenuItemText}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.dropdownWrapper}>
                <Text style={{ fontSize: 13, color: '#4b5963', fontWeight: '500', marginBottom: 4 }}>Ngày mục tiêu</Text>
                <Pressable
                  style={styles.dropdownInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dropdownText}>{toIsoDate(targetDate)}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#3a464e" />
                </Pressable>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền tiết kiệm"
              keyboardType="numeric"
              value={targetInput}
              onChangeText={(value) => setTargetInput(formatMoneyInput(value))}
            />

            <Pressable style={styles.saveBtn} onPress={saveHandler}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </Pressable>

            <Pressable style={styles.deleteBtn} onPress={deleteHandler}>
              <Text style={styles.deleteBtnText}>Xóa mục tiêu</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={targetDate}
        title="Chọn ngày mục tiêu"
        onConfirm={(date) => {
          setTargetDate(date);
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
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
  },
  typeToggleButtonActive: {
    backgroundColor: '#2bb6c2',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5963',
  },
  typeToggleTextActive: {
    color: '#fff',
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
    backgroundColor: '#ff4d4f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
