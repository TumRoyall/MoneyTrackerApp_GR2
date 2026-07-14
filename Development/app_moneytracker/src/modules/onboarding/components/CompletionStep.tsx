import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CompletionStepProps {
  onComplete: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  onComplete,
  onBack,
  isSaving,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#29bcc5" />
      </View>

      <Text style={styles.title}>🎉 Mọi thứ đã sẵn sàng!</Text>

      <Text style={styles.description}>
        Chúng tôi sẽ sử dụng thông tin bạn vừa cung cấp để tạo ngân sách thông minh dựa trên tổng tài sản của bạn khi bạn sử dụng tính năng Smart Budget.
      </Text>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.backButton} onPress={onBack} disabled={isSaving}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
        <Pressable
          style={[styles.completeButton, isSaving && styles.completeButtonDisabled]}
          onPress={onComplete}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Hoàn tất</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 24,
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
  completeButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#29bcc5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#b8e6ea',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
