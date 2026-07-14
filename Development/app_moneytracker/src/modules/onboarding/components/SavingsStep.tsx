import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SAVINGS_OPTIONS } from '../models/onboarding.types';

interface SavingsStepProps {
  selected: number;
  onSelect: (percent: number) => void;
  onApply503020: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const SavingsStep: React.FC<SavingsStepProps> = ({
  selected,
  onSelect,
  onApply503020,
  onNext,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bạn muốn tiết kiệm bao nhiêu tài sản?</Text>

      <View style={styles.sliderContainer}>
        {SAVINGS_OPTIONS.map((percent) => (
          <Pressable
            key={percent}
            style={[
              styles.percentButton,
              selected === percent && styles.percentButtonSelected,
            ]}
            onPress={() => onSelect(percent)}
          >
            <Text
              style={[
                styles.percentText,
                selected === percent && styles.percentTextSelected,
              ]}
            >
              {percent}%
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.recommendCard} onPress={onApply503020}>
        <View style={styles.recommendHeader}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.recommendTitle}>Khuyên dùng</Text>
        </View>
        <Text style={styles.recommendDescription}>Áp dụng quy tắc 50/30/20</Text>
        <View style={styles.recommendDetails}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Tiêu dùng</Text>
            <Text style={styles.ruleValue}>50%</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Lifestyle</Text>
            <Text style={styles.ruleValue}>30%</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Tiết kiệm</Text>
            <Text style={[styles.ruleValue, { color: '#29bcc5' }]}>20%</Text>
          </View>
        </View>
      </Pressable>

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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  percentButton: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentButtonSelected: {
    borderColor: '#29bcc5',
    backgroundColor: '#29bcc5',
  },
  percentText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  percentTextSelected: {
    color: '#fff',
  },
  recommendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ffd700',
    marginBottom: 24,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  star: {
    fontSize: 18,
    marginRight: 8,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  recommendDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  recommendDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  ruleItem: {
    alignItems: 'center',
  },
  ruleLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ruleValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
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
