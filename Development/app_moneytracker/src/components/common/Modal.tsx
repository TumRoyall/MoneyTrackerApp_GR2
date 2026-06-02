import { ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from './theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  showClose?: boolean;
}

export const Modal = ({
  visible,
  onClose,
  title,
  showClose = true,
}: ModalProps) => {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        <View style={styles.sheet}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showClose && (
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.content}>{/* Content handled by children */}</View>
        </View>
      </View>
    </RNModal>
  );
};

// =====================
// COMPOUND COMPONENTS
// =====================

const ModalHeader = ({ title, onClose }: { title: string; onClose?: () => void }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    {onClose && (
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </Pressable>
    )}
  </View>
);
ModalHeader.displayName = 'Modal.Header';
Modal.Header = ModalHeader;

const ModalBody = ({ children }: { children: ReactNode }) => (
  <View style={styles.content}>{children}</View>
);
ModalBody.displayName = 'Modal.Body';
Modal.Body = ModalBody;

const ModalFooter = ({ children }: { children: ReactNode }) => (
  <View style={styles.footer}>{children}</View>
);
ModalFooter.displayName = 'Modal.Footer';
Modal.Footer = ModalFooter;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    // Content styles
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
