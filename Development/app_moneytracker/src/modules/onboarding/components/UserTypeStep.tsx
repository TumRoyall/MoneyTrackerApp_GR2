import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { UserType, USER_TYPE_OPTIONS } from '../models/onboarding.types';

interface UserTypeStepProps {
  selected: UserType;
  onSelect: (type: UserType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const UserTypeStep: React.FC<UserTypeStepProps> = ({
  selected,
  onSelect,
  onNext,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bạn đang ở giai đoạn nào?</Text>

      <View style={styles.optionsContainer}>
        {USER_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.optionCard,
              selected === option.value && styles.optionCardSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e8e8e8',
  },
  optionCardSelected: {
    borderColor: '#29bcc5',
    backgroundColor: '#f0fdfc',
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
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
