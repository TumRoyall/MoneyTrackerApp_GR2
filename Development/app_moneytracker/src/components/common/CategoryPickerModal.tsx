import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { Category } from '@/modules/category/models/category.types';

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  selectedCategoryId?: string;
  selectedCategoryIds?: string[]; // For multi-select mode
  multiSelect?: boolean;
  allowedTypes?: CategoryType[]; // If not provided, defaults to both 'EXPENSE' and 'INCOME'
  initialType?: CategoryType; // Which tab to show initially if both are allowed
  categories?: Category[]; // Optional static list of categories. If provided, skips fetching from API.
}

export function CategoryPickerModal({
  visible,
  onClose,
  onSelectCategory,
  selectedCategoryId,
  selectedCategoryIds = [],
  multiSelect = false,
  allowedTypes = ['EXPENSE', 'INCOME'],
  initialType = 'EXPENSE',
  categories: propCategories,
}: CategoryPickerModalProps) {
  const { getCategories } = useCategoryUsecases();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentType, setCurrentType] = useState<CategoryType>(initialType);

  // Update current type if allowedTypes change and currentType is no longer allowed
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      if (!allowedTypes.includes(currentType)) {
        setCurrentType(allowedTypes[0]);
      } else if (allowedTypes.includes(initialType) && !selectedCategoryId) {
        // Only reset to initialType if no category is selected, otherwise keep user's last choice
        setCurrentType(initialType);
      }
    }
  }, [visible, allowedTypes, initialType]);

  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !propCategories, // Skip fetch if static categories provided
  });

  const categories = propCategories || fetchedCategories;

  const displayCategories = useMemo(() => {
    // 1. Filter by type
    let filtered = categories.filter(
      (item) => (String(item.type || '').toUpperCase() === currentType)
    );

    // 2. Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((item) => {
        const name = item.name.toLowerCase();
        const group = (item.groupId ?? '').toLowerCase();
        return name.includes(q) || group.includes(q);
      });
    }

    return filtered;
  }, [categories, currentType, searchQuery]);

  // Set the current tab based on the selected category if it exists and modal is opened
  useEffect(() => {
    if (visible && selectedCategoryId) {
      const cat = categories.find((c) => c.categoryId === selectedCategoryId);
      if (cat) {
        const catType = String(cat.type || '').toUpperCase() as CategoryType;
        if (allowedTypes.includes(catType)) {
          setCurrentType(catType);
        }
      }
    }
  }, [visible, selectedCategoryId, categories, allowedTypes]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.categoryPickerSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <Text style={styles.categoryPickerHint}>
            Chọn danh mục từ danh sách bên dưới hoặc tìm kiếm.
          </Text>

          {allowedTypes.length > 1 && (
            <View style={styles.typeToggleRow}>
              <Pressable
                style={[
                  styles.typeToggleBtn,
                  currentType === 'EXPENSE' ? styles.typeToggleBtnActive : null,
                ]}
                onPress={() => setCurrentType('EXPENSE')}
              >
                <Text
                  style={[
                    styles.typeToggleBtnText,
                    currentType === 'EXPENSE' ? styles.typeToggleBtnTextActive : null,
                  ]}
                >
                  Chi phí
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeToggleBtn,
                  currentType === 'INCOME' ? styles.typeToggleBtnActive : null,
                ]}
                onPress={() => setCurrentType('INCOME')}
              >
                <Text
                  style={[
                    styles.typeToggleBtnText,
                    currentType === 'INCOME' ? styles.typeToggleBtnTextActive : null,
                  ]}
                >
                  Thu nhập
                </Text>
              </Pressable>
            </View>
          )}

          <TextInput
            style={styles.categoryPickerSearchInput}
            placeholder="Tìm danh mục..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />

          <ScrollView
            style={styles.categoryPickerScroll}
            contentContainerStyle={styles.categoryPickerContent}
          >
            {displayCategories.length === 0 ? (
              <View style={styles.emptyCategoryBox}>
                <Text style={styles.emptyText}>Chưa có danh mục nào.</Text>
              </View>
            ) : (
              <View style={styles.categoryGrid}>
                {displayCategories.map((category) => {
                  const selected = multiSelect 
                    ? selectedCategoryIds.includes(category.categoryId)
                    : selectedCategoryId === category.categoryId;
                  const catColor = category.color || '#29bcc8';
                  return (
                    <Pressable
                      key={category.categoryId}
                      onPress={() => onSelectCategory(category)}
                      style={[
                        styles.categoryGridItem,
                        selected && {
                          borderColor: catColor,
                          backgroundColor: catColor + '15',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryGridIconWrap,
                          { backgroundColor: catColor + '20' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(category.icon as any) || 'help'}
                          size={22}
                          color={catColor}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryGridLabel,
                          selected && { color: catColor },
                        ]}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {multiSelect && (
            <View style={styles.multiSelectFooter}>
              <Pressable style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Xong</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  categoryPickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  categoryPickerHint: {
    fontSize: 14,
    color: '#6c737a',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  typeToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f2f4',
  },
  typeToggleBtnActive: {
    backgroundColor: '#29bcc8',
  },
  typeToggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6c737a',
  },
  typeToggleBtnTextActive: {
    color: '#fff',
  },
  categoryPickerSearchInput: {
    marginHorizontal: 20,
    marginBottom: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f7f9',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1f1f1f',
  },
  categoryPickerScroll: {
    paddingHorizontal: 20,
  },
  categoryPickerContent: {
    paddingBottom: 40,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryGridItem: {
    width: '31%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    gap: 8,
  },
  categoryGridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGridLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    height: 34,
  },
  emptyCategoryBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6c737a',
  },
  multiSelectFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
  },
  doneBtn: {
    backgroundColor: '#29bcc8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
