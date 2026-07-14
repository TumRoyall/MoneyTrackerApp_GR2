/**
 * Custom Dialog Component
 *
 * A simple dialog/modal component that doesn't require react-native-paper.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface DialogProps {
  visible: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Dialog: React.FC<DialogProps> = ({ visible, onDismiss, children, style }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={[styles.dialog, style]} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface DialogIconProps {
  icon: string;
  size?: number;
}

export const DialogIcon: React.FC<DialogIconProps> = ({ icon, size = 40 }) => {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { fontSize: size }]}>⚡</Text>
    </View>
  );
};

export const DialogTitle: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

export const DialogContent: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

export const DialogActions: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  return <View style={[styles.actions, style]}>{children}</View>;
};

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
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 12,
  },
  content: {
    width: '100%',
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
});
