import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from './theme';

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const ProgressBar = ({
  value,
  showLabel = false,
  variant = 'default',
}: ProgressBarProps) => {
  const fillWidth = Math.min(Math.max(value, 0), 100);

  const variantColors = {
    default: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.error || '#f44336',
  };

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${fillWidth}%`, backgroundColor: variantColors[variant] },
          ]}
        />
      </View>
      {showLabel && <Text style={styles.label}>{Math.round(value)}%</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#e8edf0',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
});