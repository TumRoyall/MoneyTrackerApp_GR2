import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IncomeRange, INCOME_RANGE_OPTIONS } from '../models/onboarding.types';

interface IncomeStepProps {
  selected: IncomeRange;
  onSelect: (range: IncomeRange) => void;
  onNext: () => void;
  onBack: () => void;
}

export const IncomeStep: React.FC<IncomeStepProps> = ({
  selected,
  onSelect,
  onNext,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thu nhập hàng tháng của bạn khoảng bao nhiêu?</Text>

      <View style={styles.optionsContainer}>
        {INCOME_RANGE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.optionCard,
              selected === option.value && styles.optionCardSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View style={styles.radioOuter}>
              {selected === option.value && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.optionLabel,
                selected === option.value && styles.optionLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
        <Pressable
          style={[styles.nextButton, !selected && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!selected}
        >
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
  optionsContainer: {
    flex: 1,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e8e8e8',
  },
  optionCardSelected: {
    borderColor: '#29bcc5',
    backgroundColor: '#f0fdfc',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#29bcc5',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionLabelSelected: {
    color: '#29bcc5',
    fontWeight: '700',
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
  nextButtonDisabled: {
    backgroundColor: '#b8e6ea',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
