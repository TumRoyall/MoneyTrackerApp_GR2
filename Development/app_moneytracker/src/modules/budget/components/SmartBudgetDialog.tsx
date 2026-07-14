/**
 * Smart Budget Dialog Component
 *
 * Confirmation dialog shown before generating Smart Budget.
 */

import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';

export interface SmartBudgetDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Dialog component for Smart Budget creation confirmation.
 *
 * Shows a brief explanation of what Smart Budget will do
 * and allows user to confirm or cancel.
 */
export function SmartBudgetDialog({
  visible,
  onDismiss,
  onConfirm,
  loading = false,
}: SmartBudgetDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚡</Text>
          </View>
          <Text style={styles.title}>Tạo Budget Thông minh</Text>
          <View style={styles.content}>
            <Text style={styles.description}>
              Hệ thống sẽ tự động tạo ngân sách dựa trên:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Tổng tài sản hiện có</Text>
              <Text style={styles.bulletItem}>• Thông tin của bạn</Text>
            </View>

            <Text style={styles.note}>
              Bạn vẫn có thể chỉnh sửa lại sau khi tạo.
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={onDismiss}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Huỷ</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Đang tạo...' : 'Tạo ngay'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12,
  },
  content: {
    width: '100%',
    paddingHorizontal: 4,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#179ea9',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
