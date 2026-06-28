import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEventUsecases } from '@/modules/event/usecases/eventUsecases';
import { CategoryPickerModal } from '@/components/common';
import { expenseGroups } from '@/modules/category/data/categoryIconGroups';
import { Category } from '@/modules/category/models/category.types';

const defaultGuestCategories: Category[] = expenseGroups.map((group, index) => ({
  categoryId: `guest-${group.id}-${index}`,
  name: group.name,
  type: 'EXPENSE',
  icon: group.icon,
  color: group.color,
  createdAt: new Date().toISOString()
}));

export default function GuestPortalScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { addGuestTransaction, getGuestEventInfo } = useEventUsecases();

  const { data: eventInfo, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['guestEventInfo', eventId],
    queryFn: () => getGuestEventInfo(eventId),
    retry: false,
  });

  const [guestEmail, setGuestEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('');
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = guestEmail.trim().toLowerCase();
    // Email validation đơn giản (regex chuẩn RFC lite)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ (VD: ten@example.com)');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGuestTransaction(eventId, {
        // Tên hiển thị mặc định = email. Admin có thể sửa sau trong app.
        creatorName: trimmedEmail,
        creatorEmail: trimmedEmail,
        amount: Number(amount),
        categoryId: selectedCategoryId,
        categoryName: selectedCategoryName,
        categoryIcon: selectedCategoryIcon,
        note: note.trim(),
        date: new Date().toISOString(),
      });
      setIsSuccess(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={64} color="#34a795" />
          <Text style={styles.successTitle}>Thành công!</Text>
          <Text style={styles.successDesc}>Giao dịch của bạn đã được ghi nhận vào sự kiện.</Text>
          <Pressable style={styles.submitBtn} onPress={() => {
            setIsSuccess(false);
            setAmount('');
            setNote('');
            // Giữ lại tên + email để khách không phải nhập lại nếu thêm nhiều giao dịch
          }}>
            <Text style={styles.submitBtnText}>Thêm giao dịch khác</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#29bcc8" />
          <Text style={styles.loadingText}>Đang tải thông tin sự kiện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (eventError || !eventInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Ionicons name="warning-outline" size={64} color="#f44336" />
          <Text style={styles.errorTitle}>Lỗi kết nối</Text>
          <Text style={styles.errorDesc}>Không thể tải thông tin sự kiện, hoặc sự kiện không tồn tại.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (eventInfo.status !== 'ACTIVE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Ionicons name="lock-closed-outline" size={64} color="#6c737a" />
          <Text style={styles.closedTitle}>Sự kiện đã đóng</Text>
          <Text style={styles.closedDesc}>
            Chủ sự kiện "{eventInfo.name}" đã chốt sổ (kết toán). Bạn không thể gửi thêm giao dịch vào sự kiện này nữa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="receipt-outline" size={48} color="#29bcc8" />
          <Text style={styles.title}>Gửi Giao Dịch</Text>
          <Text style={styles.subtitle}>Ghi nhận chi tiêu của bạn vào sự kiện "{eventInfo?.name}". Không cần tải app!</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email của bạn <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="VD: ten@example.com"
            value={guestEmail}
            onChangeText={setGuestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helper}>
            Tên hiển thị của bạn trong sự kiện sẽ mặc định là email. Chủ sự kiện có thể đổi tên cho bạn sau.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số tiền (VNĐ)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 50000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Danh mục</Text>
          <Pressable style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {selectedCategoryIcon ? (
                <View style={[styles.avatarEditIconWrap, { position: 'relative', right: 0, bottom: 0, backgroundColor: selectedCategoryColor + '20', width: 32, height: 32 }]}>
                  <MaterialCommunityIcons name={selectedCategoryIcon as any} size={20} color={selectedCategoryColor} />
                </View>
              ) : (
                <Ionicons name="grid-outline" size={24} color="#6c737a" />
              )}
              <Text style={styles.selectBtnText}>{selectedCategoryName || 'Chọn danh mục'}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6c737a" />
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Ăn trưa, uống nước..."
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        <Pressable 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi Giao Dịch</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={defaultGuestCategories}
        allowedTypes={['EXPENSE']}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(cat) => {
          setSelectedCategoryId(cat.categoryId);
          setSelectedCategoryName(cat.name);
          setSelectedCategoryIcon(cat.icon || 'help');
          setSelectedCategoryColor(cat.color || '#29bcc8');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f1f1f',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6b75',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f36e79',
    fontWeight: '700',
  },
  helper: {
    fontSize: 12,
    color: '#6c737a',
    marginTop: 6,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ebef',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#1f1f1f',
  },
  selectBtn: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#e8ebef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 16,
    color: '#1f1f1f',
  },
  avatarEditIconWrap: {
    backgroundColor: '#29bcc8',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: '#29bcc8',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#34a795',
    marginBottom: 16,
  },
  successDesc: {
    fontSize: 16,
    color: '#6c737a',
    textAlign: 'center',
    marginBottom: 32,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c737a',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 16,
    color: '#6c737a',
    textAlign: 'center',
  },
  closedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f1f1f',
    marginTop: 16,
    marginBottom: 8,
  },
  closedDesc: {
    fontSize: 16,
    color: '#6c737a',
    textAlign: 'center',
    lineHeight: 24,
  },
});
