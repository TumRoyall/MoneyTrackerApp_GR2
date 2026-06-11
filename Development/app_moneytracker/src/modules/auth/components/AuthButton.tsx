import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const AuthButton = ({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: AuthButtonProps) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryText : styles.secondaryText]}>
        {loading ? 'Dang xu ly...' : label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#111',
  },
  secondary: {
    backgroundColor: '#f1f1f1',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#111',
  },
});
