import { ReactNode, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing, typography } from './theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Simple flat Input
export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError, isFocused && { borderColor: colors.primary }]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Compound Input (for complex forms)
export const InputLabel = ({ children }: { children: ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

export const InputField = ({ error, ...props }: TextInputProps & { error?: string }) => (
  <View style={[styles.inputWrapper, error && styles.inputError]}>
    <TextInput
      style={styles.input}
      placeholderTextColor={colors.textTertiary}
      {...props}
    />
  </View>
);

Input.Label = InputLabel;
Input.Field = InputField;

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  iconLeft: {
    paddingLeft: spacing.lg,
  },
  iconRight: {
    paddingRight: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: -spacing.xs,
  },
});
