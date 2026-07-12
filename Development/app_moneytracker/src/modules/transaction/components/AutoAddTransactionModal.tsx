import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/components/common/theme';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface AutoAddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export const AutoAddTransactionModal = ({ visible, onClose, onSubmit }: AutoAddTransactionModalProps) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText('');
      // Focus input when modal opens to show keyboard (with dictation mic option)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
  };

  const handleMicPress = () => {
    // Focus the input to let the user use the device's native keyboard dictation
    inputRef.current?.focus();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Thêm giao dịch tự động">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.instruction}>
            Nhập nội dung giao dịch (hoặc dùng biểu tượng Micro trên bàn phím để nói).
          </Text>
          
          <Text style={styles.example}>
            VD: "Ăn phở 45k", "Đổ xăng 50k", "Lương tháng 15tr"
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="VD: Mua cafe 35k"
              placeholderTextColor={colors.textDisabled}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable 
              style={({ pressed }) => [styles.micButton, pressed && styles.micButtonPressed]} 
              onPress={handleMicPress}
            >
              <Ionicons name="mic" size={24} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Button
              title="Phân tích & Tạo"
              onPress={handleSubmit}
              disabled={!text.trim()}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.lg,
  },
  instruction: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  example: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    paddingTop: 0,
    paddingBottom: 0,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  micButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  micButtonPressed: {
    opacity: 0.7,
  },
  footer: {
    marginTop: spacing.xl,
  },
  submitBtn: {
    width: '100%',
  },
});
