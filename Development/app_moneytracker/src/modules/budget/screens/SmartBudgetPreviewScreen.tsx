/**
 * Smart Budget Preview Screen
 *
 * Full screen for Smart Budget preview with adjustable percentages.
 * Connected to expo-router at /tools/budgets/smart-preview
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { SmartBudgetPreview as SmartBudgetPreviewComponent } from '@/modules/budget/components/SmartBudgetPreview';
import { SmartBudgetItem } from '@/modules/budget/services/smartBudgetService';
import {
  generateSmartBudget,
  createBudgetsFromSmartBudget,
  getTotalRegularBalance,
  getOnboardingData,
} from '@/modules/budget/usecases/smartBudgetUsecases';

export const SmartBudgetPreviewScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [totalAsset, setTotalAsset] = useState(0);
  const [savingTargetPercent, setSavingTargetPercent] = useState(20);
  const [items, setItems] = useState<SmartBudgetItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load Smart Budget data on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await generateSmartBudget();
        setTotalAsset(result.totalAsset);
        setSavingTargetPercent(result.savingTargetPercent);
        setItems(result.items);
        setError(null);
      } catch (err) {
        console.error('Failed to generate smart budget:', err);
        setError('Không thể tạo Budget Thông minh. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle cancel - go back
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Handle confirm - create budgets
  const handleConfirm = useCallback(
    async (finalItems: SmartBudgetItem[]) => {
      if (totalAsset <= 0) {
        Alert.alert('Lỗi', 'Tổng tài sản không hợp lệ.');
        return;
      }

      // Check if we have valid categories
      const validItems = finalItems.filter((item) => item.amount > 0);
      if (validItems.length === 0) {
        Alert.alert('Lỗi', 'Không có ngân sách nào để tạo.');
        return;
      }

      setCreating(true);
      try {
        const budgetIds = await createBudgetsFromSmartBudget(validItems);
        Alert.alert(
          'Thành công',
          `Đã tạo ${budgetIds.length} ngân sách thông minh cho tháng này.`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(tabs)/tools/budgets');
              },
            },
          ]
        );
      } catch (err) {
        console.error('Failed to create smart budgets:', err);
        Alert.alert('Lỗi', 'Không thể tạo ngân sách. Vui lòng thử lại.');
      } finally {
        setCreating(false);
      }
    },
    [totalAsset, router]
  );

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#179ea9" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            maxWidth: 300,
          }}
        >
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '600', marginBottom: 8 }}>⚠️</Text>
          <Text style={{ fontSize: 14, color: '#374151', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <ActivityIndicator size="small" color="#179ea9" />
        </View>
      </View>
    );
  }

  // Empty asset state
  if (totalAsset <= 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            maxWidth: 300,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
          <Text style={{ fontSize: 16, color: '#374151', fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
            Chưa có tài sản
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 }}>
            Hãy thêm ví REGULAR và nạp tiền để sử dụng Budget Thông minh.
          </Text>
          <ActivityIndicator size="small" color="#179ea9" />
        </View>
      </View>
    );
  }

  // Main preview
  return (
    <SmartBudgetPreviewComponent
      totalAsset={totalAsset}
      savingTargetPercent={savingTargetPercent}
      items={items}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={creating}
    />
  );
};

export default SmartBudgetPreviewScreen;
