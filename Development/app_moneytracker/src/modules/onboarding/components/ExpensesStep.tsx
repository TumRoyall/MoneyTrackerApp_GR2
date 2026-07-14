import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { queryAll } from '@/core/db/sqlite';
import { Category } from '@/modules/category/models/category.types';

interface ExpensesStepProps {
  selected: string[];
  onToggle: (categoryId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ExpensesStep: React.FC<ExpensesStepProps> = ({
  selected,
  onToggle,
  onNext,
  onBack,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const expenseCategories = await queryAll<Category>(
        `SELECT * FROM categories
         WHERE type = 'EXPENSE'
           AND (deletedAt IS NULL OR deletedAt = '')
         ORDER BY name ASC`
      );
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#29bcc5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Các khoản thường xuyên bạn phải chi tiêu trong tháng là?</Text>
      <Text style={styles.subtitle}>Chọn các danh mục phù hợp (có thể bỏ trống)</Text>

      <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const isSelected = selected.includes(category.categoryId);
            return (
              <Pressable
                key={category.categoryId}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => onToggle(category.categoryId)}
              >
                <View style={[styles.iconContainer, { backgroundColor: category.color || '#f0f0f0' }]}>
                  <Text style={styles.categoryIcon}>{category.icon || '📦'}</Text>
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && styles.categoryNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Tiếp tục</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderColor: '#29bcc5',
    backgroundColor: '#f0fdfc',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  categoryNameSelected: {
    color: '#29bcc5',
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#29bcc5',
    borderColor: '#29bcc5',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#29bcc5',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
