/**
 * Smart Budget Preview Component
 *
 * Displays the Smart Budget preview with adjustable percentages.
 * Allows users to modify allocations before confirming.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SmartBudgetItem, recalculateSmartBudget, formatCurrency } from '@/modules/budget/services/smartBudgetService';
import { formatVndAmount } from '@/shared/utils/money';
import { CategoryIcon } from '@/components/common/CategoryIcon';

// Default Smart Budget categories
const DEFAULT_CATEGORIES: Record<string, { name: string; icon: string; color: string; defaultPercent: number }> = {
  food: { name: 'Thức ăn & Đồ uống', icon: '🍜', color: '#F59E0B', defaultPercent: 25 },
  home: { name: 'Nhà', icon: '🏠', color: '#10B981', defaultPercent: 15 },
  transport: { name: 'Giao thông', icon: '🚗', color: '#64748B', defaultPercent: 10 },
  entertainment: { name: 'Giải trí', icon: '🎮', color: '#8B5CF6', defaultPercent: 7 },
  shopping: { name: 'Mua sắm', icon: '🛍️', color: '#EC4899', defaultPercent: 8 },
  other: { name: 'Khác', icon: '📦', color: '#6B7280', defaultPercent: 35 },
};

// Get available categories (not including savings which is always required)
const AVAILABLE_CATEGORIES: Array<{ key: string; name: string; icon: string; color: string; defaultPercent: number }> = Object.keys(DEFAULT_CATEGORIES)
  .map((k: string) => ({
    key: k,
    ...DEFAULT_CATEGORIES[k],
  }));

import { Category } from '@/modules/category/models/category.types';

export interface SmartBudgetPreviewProps {
  totalAsset: number;
  savingTargetPercent: number;
  items: SmartBudgetItem[];
  categories?: Category[];
  onConfirm: (items: SmartBudgetItem[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Preview component for Smart Budget.
 *
 * Features:
 * - Display total asset and savings info
 * - Show each budget category with current allocation
 * - Allow user to adjust percentages (tap to edit)
 * - Auto-rebalance percentages
 * - Confirm or cancel actions
 */
export function SmartBudgetPreview({
  totalAsset,
  savingTargetPercent,
  items: initialItems,
  categories = [],
  onConfirm,
  onCancel,
  loading = false,
}: SmartBudgetPreviewProps) {
  const [items, setItems] = useState<SmartBudgetItem[]>(initialItems);
  const [showDialog, setShowDialog] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate total percentage
  const totalPercent = useMemo(() => {
    return items.reduce((sum, item) => sum + item.percent, 0);
  }, [items]);

  // Get categories that can be added (not already in items)
  const availableToAdd = useMemo(() => {
    // Collect all category IDs that are already used.
    // For default items (key like 'food'), their categoryGroupId is 'food'.
    // We need to find the corresponding category in the DB and mark its ID as used.
    const usedCategoryIds = new Set<string>();
    
    items.forEach((item) => {
      // If the key is already a UUID (from custom added category), add it
      usedCategoryIds.add(item.key);
      
      // Also find if there is a category in the DB that matches this item's groupId
      if (item.categoryGroupId && categories.length > 0) {
        const matchingCat = categories.find(c => c.groupId === item.categoryGroupId);
        if (matchingCat) {
          usedCategoryIds.add(matchingCat.categoryId);
        }
      }
    });
    
    // If categories are provided (from API/DB), use them
    if (categories.length > 0) {
      return categories
        .filter((c) => c.type === 'EXPENSE' || (c.type as any) === 'expense')
        .filter((c) => !usedCategoryIds.has(c.categoryId))
        .map((c) => ({
          key: c.categoryId,
          name: c.name,
          icon: c.icon || '📦',
          color: c.color || '#6B7280',
          defaultPercent: 0,
        }));
    }
    
    // Fallback to default categories if no DB categories loaded
    return AVAILABLE_CATEGORIES.filter((c) => !usedCategoryIds.has(c.key));
  }, [items, categories]);

  // Handle percentage change
  const handlePercentChange = useCallback(
    (key: string, newPercent: number) => {
      const updated = recalculateSmartBudget(items, key, newPercent, totalAsset);
      setItems(updated.items);
    },
    [items, totalAsset]
  );

  // Handle delete item
  const handleDeleteItem = useCallback(
    (key: string) => {
      const itemToDelete = items.find((i) => i.key === key);
      if (!itemToDelete) return;

      // Remove the item and redistribute its percentage
      const remainingItems = items.filter((i) => i.key !== key);
      const deletedPercent = itemToDelete.percent;

      if (remainingItems.length === 0) {
        setItems([]);
        return;
      }

      // Redistribute deleted percent to other items proportionally
      const totalRemainingPercent = remainingItems.reduce((sum, i) => sum + i.percent, 0);
      const updatedItems = remainingItems.map((item) => {
        const proportion = totalRemainingPercent > 0 ? item.percent / totalRemainingPercent : 1 / remainingItems.length;
        const newPercent = Math.max(0, item.percent + deletedPercent * proportion);
        return {
          ...item,
          percent: Math.round(newPercent * 10) / 10,
          amount: Math.round((totalAsset * newPercent) / 100),
        };
      });

      setItems(updatedItems);
    },
    [items, totalAsset]
  );

  // Handle add item
  const handleAddItem = useCallback(
    (categoryKey: string) => {
      // Find from availableToAdd which holds both dynamic and fallback categories
      const category = availableToAdd.find((c) => c.key === categoryKey);
      if (!category) return;

      // Default percent for new item
      const newPercent = category.defaultPercent || 0;

      // Add new item without touching others
      const newItem: SmartBudgetItem = {
        key: categoryKey,
        categoryGroupId: categoryKey,
        categoryName: category.name,
        icon: category.icon,
        color: category.color,
        percent: newPercent,
        amount: Math.round((totalAsset * newPercent) / 100),
      };

      setItems([...items, newItem]);
      setShowAddModal(false);
    },
    [items, totalAsset, availableToAdd]
  );

  // Handle confirm button press
  const handleConfirmPress = useCallback(async () => {
    await onConfirm(items);
  }, [items, onConfirm]);

  // Handle cancel dialog (kept for compatibility if needed, but unused)
  const handleCancelDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  // Handle direct percent text input
  const handlePercentTextChange = useCallback(
    (key: string, text: string) => {
      // Remove any non-numeric characters except dot
      const numericText = text.replace(/[^0-9.]/g, '');
      if (numericText === '') {
        handlePercentChange(key, 0);
        return;
      }
      const val = parseFloat(numericText);
      if (!isNaN(val)) {
        handlePercentChange(key, val);
      }
    },
    [handlePercentChange]
  );

  // Render a single budget item
  const renderItem = useCallback(
    ({ item }: { item: SmartBudgetItem }) => {
      const progressWidth = Math.min(item.percent, 100);
      const canDelete = item.key !== 'savings'; // Savings is required

      return (
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <CategoryIcon icon={item.icon} size={24} color={item.color} />
              <Text style={styles.itemName}>{item.categoryName}</Text>
            </View>
            <View style={styles.itemActions}>
              {canDelete && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.key)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </Pressable>
              )}
              <View style={styles.percentAdjuster}>
                <Pressable
                  style={styles.stepButton}
                  onPress={() => handlePercentChange(item.key, Math.max(0, item.percent - 5))}
                >
                  <Ionicons name="remove" size={14} color="#179ea9" />
                </Pressable>
                
                <View style={styles.percentInputWrapper}>
                  <TextInput
                    style={[styles.itemPercentInput, item.percent === 0 && styles.zeroPercent]}
                    value={item.percent.toString()}
                    onChangeText={(text) => handlePercentTextChange(item.key, text)}
                    keyboardType="numeric"
                    maxLength={5}
                    selectTextOnFocus
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>

                <Pressable
                  style={styles.stepButton}
                  onPress={() => handlePercentChange(item.key, Math.min(100, item.percent + 5))}
                >
                  <Ionicons name="add" size={14} color="#179ea9" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressWidth}%`, backgroundColor: item.color },
              ]}
            />
          </View>

          <Text style={styles.itemAmount}>{formatVndAmount(item.amount)}</Text>
        </View>
      );
    },
    [handlePercentChange, handlePercentTextChange, handleDeleteItem]
  );

  // Render add button
  const renderAddButton = useCallback(() => {
    if (availableToAdd.length === 0) return null;

    return (
      <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add-circle-outline" size={20} color="#179ea9" />
        <Text style={styles.addButtonText}>Thêm budget</Text>
      </Pressable>
    );
  }, [availableToAdd.length]);

  // Calculate remaining percentage
  const remainingPercent = 100 - totalPercent;
  const remainingAmount = totalAsset - items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xem trước Budget Thông minh</Text>
        <Text style={styles.headerSubtitle}>
          Điều chỉnh tỷ lệ phân bổ nếu cần
        </Text>
      </View>

      {/* Total Asset Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Tổng tài sản</Text>
        <Text style={styles.totalAmount}>{formatVndAmount(totalAsset)}</Text>
        <View style={styles.savingsInfo}>
          <Text style={styles.savingsLabel}>Mục tiêu tiết kiệm: </Text>
          <Text style={styles.savingsPercent}>{savingTargetPercent}%</Text>
        </View>
      </View>

      {/* Budget Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListFooterComponent={renderAddButton}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng phân bổ:</Text>
          <Text
            style={[
              styles.summaryPercent,
              Math.abs(remainingPercent) < 0.1
                ? styles.summaryOk
                : remainingPercent < 0
                ? styles.summaryOver
                : styles.summaryRemaining,
            ]}
          >
            {totalPercent.toFixed(1)}%
          </Text>
        </View>

        {remainingPercent > 0.1 && (
          <View style={styles.remainingInfo}>
            <Text style={styles.remainingText}>
              📌 Còn dư {remainingPercent.toFixed(1)}% ({formatVndAmount(remainingAmount)})
            </Text>
          </View>
        )}

        {remainingPercent < -0.1 && (
          <View style={[styles.remainingInfo, styles.remainingWarning]}>
            <Text style={styles.remainingWarningText}>
              ⚠️ Vượt quá 100%! Giảm bớt một số khoản.
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Quay lại</Text>
          </Pressable>
          <Pressable
            style={[
              styles.confirmButton,
              (loading || Math.abs(remainingPercent) > 0.1) && styles.buttonDisabled,
            ]}
            onPress={handleConfirmPress}
            disabled={loading || Math.abs(remainingPercent) > 0.1}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Xác nhận tạo</Text>
            )}
          </Pressable>
        </View>
      </View>


      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Budget</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView style={styles.categoryList}>
              {availableToAdd.map((category) => (
                <Pressable
                  key={category.key}
                  style={styles.categoryItem}
                  onPress={() => handleAddItem(category.key)}
                >
                  <CategoryIcon icon={category.icon} color={category.color} size={24} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryPercent}>{category.defaultPercent}%</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  totalCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#179ea9',
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  savingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  savingsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  savingsPercent: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  percentAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 2,
  },
  itemPercentInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#179ea9',
    textAlign: 'center',
    minWidth: 30,
    padding: 0,
    margin: 0,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#179ea9',
    marginLeft: 2,
  },
  zeroPercent: {
    color: '#9CA3AF',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    fontSize: 12,
    color: '#179ea9',
    fontWeight: '500',
  },
  editSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginLeft: 8,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValueText: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
    textAlign: 'center',
  },
  percentSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5d6972',
  },
  doneButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryOk: {
    color: '#10B981',
  },
  summaryOver: {
    color: '#EF4444',
  },
  summaryRemaining: {
    color: '#F59E0B',
  },
  remainingInfo: {
    marginBottom: 12,
  },
  remainingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  remainingWarning: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  remainingWarningText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#179ea9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Item actions row (delete + percent adjuster)
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Delete button
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#179ea9',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#179ea9',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  categoryPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
