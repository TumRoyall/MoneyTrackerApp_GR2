import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useCategoryUsecases } from '@/modules/category/usecases';
import { Category } from '@/modules/category/models/category.types';
import { categoryGroups } from '@/modules/category/data/categoryIconGroups';
import { CategoryIcon } from '@/components/common/CategoryIcon';

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  selectedCategoryId?: string;
  selectedCategoryIds?: string[];
  multiSelect?: boolean;
  allowedTypes?: CategoryType[];
  initialType?: CategoryType;
  categories?: Category[];
}

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#64748B', '#10B981', '#F97316',
  '#6366F1', '#DDA0DD', '#4169E1', '#4CAF50',
];

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
  const { getCategories, createCategory } = useCategoryUsecases();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentType, setCurrentType] = useState<CategoryType>(initialType);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('HelpCircle');
  const [newCategoryColor, setNewCategoryColor] = useState('#9CA3AF');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setShowAddForm(false);
      setShowIconPicker(false);
      setNewCategoryName('');
      setNewCategoryIcon('HelpCircle');
      setNewCategoryColor('#9CA3AF');
      if (!allowedTypes.includes(currentType)) {
        setCurrentType(allowedTypes[0]);
      } else if (allowedTypes.includes(initialType) && !selectedCategoryId) {
        setCurrentType(initialType);
      }
    }
  }, [visible, allowedTypes, initialType]);

  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !propCategories,
  });

  const categories = propCategories || fetchedCategories;

  const displayCategories = useMemo(() => {
    let filtered = categories.filter(
      (item) => (String(item.type || '').toUpperCase() === currentType)
    );

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    try {
      // Create on server and sync locally
      const created = await createCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: currentType,
      });

      // Select the new category and close the add form
      onSelectCategory(created);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Lỗi', 'Không thể tạo danh mục. Vui lòng thử lại.');
    }
  };

  if (showAddForm) {
    if (showIconPicker) {
      return (
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIconPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.iconPickerSheet}>
              <View style={styles.dragIndicatorWrap}>
                <View style={styles.dragIndicator} />
              </View>

              <ScrollView style={styles.iconPickerScroll}>
                {categoryGroups.map((group) => {
                  // Only show icon groups relevant to current type
                  if (currentType !== group.type) return null;

                  return (
                    <View key={group.id} style={styles.iconGroupSection}>
                      <Text style={styles.iconGroupTitle}>{group.emoji} {group.name}</Text>
                      <View style={styles.iconGrid}>
                        {group.subIcons.map((subIcon) => {
                          const isSelected = newCategoryIcon === subIcon.icon;
                          return (
                            <Pressable
                              key={subIcon.icon}
                              style={[
                                styles.iconOptionCircle,
                                { backgroundColor: subIcon.color + '20' },
                                isSelected && { borderWidth: 2, borderColor: subIcon.color },
                              ]}
                              onPress={() => {
                                setNewCategoryIcon(subIcon.icon);
                                setNewCategoryColor(subIcon.color);
                                setShowIconPicker(false);
                              }}
                            >
                              <CategoryIcon
                                icon={subIcon.icon}
                                size={26}
                                color={subIcon.color}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    }

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
              <Pressable onPress={() => setShowAddForm(false)}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </Pressable>
            </View>
            
            <View style={styles.dragIndicatorWrap}>
              <View style={styles.dragIndicator} />
            </View>

            <Text style={styles.createTitle}>Tạo tên danh mục và biểu tượng của bạn</Text>
            
            <View style={styles.createInputRow}>
              <Pressable
                style={[styles.selectedIconCircle, { backgroundColor: newCategoryColor + '20' }]}
                onPress={() => setShowIconPicker(true)}
              >
                <CategoryIcon
                  icon={newCategoryIcon}
                  size={32}
                  color={newCategoryColor}
                />
              </Pressable>

              <TextInput
                style={styles.createInput}
                placeholder="Tiêu đề"
                placeholderTextColor="#999"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
            </View>

            <View style={styles.createBtnWrap}>
              <Pressable style={styles.createSubmitBtn} onPress={handleCreateCategory}>
                <Text style={styles.createSubmitBtnText}>Tạo danh mục</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
            <View style={styles.headerRight}>
              <Pressable
                style={styles.addCategoryBtn}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add" size={24} color="#29bcc8" />
              </Pressable>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
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
                        <CategoryIcon
                          icon={category.icon || 'HelpCircle'}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addCategoryBtn: {
    padding: 4,
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#29bcc8',
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
  dragIndicatorWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dcdcdc',
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  selectedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createInput: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#29bcc8',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  createBtnWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  createSubmitBtn: {
    backgroundColor: '#29bcc8',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSubmitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  iconPickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 20,
  },
  iconPickerScroll: {
    paddingHorizontal: 20,
  },
  iconGroupSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  iconGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  iconOptionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
