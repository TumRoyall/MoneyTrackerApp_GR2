import { ActivityIndicator, Pressable, StyleSheet, StyleProp, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from './theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const heights = { sm: 40, md: 48, lg: 54 };
const paddingH = { sm: 12, md: 16, lg: 20 };

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const variants = {
    primary: {
      bg: colors.primary,
      text: colors.textInverse,
      border: 'transparent',
    },
    secondary: {
      bg: colors.primaryLight,
      text: '#0f8c95',
      border: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textSecondary,
      border: 'transparent',
    },
    danger: {
      bg: colors.error,
      text: colors.textInverse,
      border: 'transparent',
    },
  };

  const v = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        style,
        {
          height: heights[size],
          paddingHorizontal: paddingH[size],
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});