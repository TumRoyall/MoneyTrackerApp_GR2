import { StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, spacing, typography } from './theme';

interface StatusBadgeProps {
  status: 'active' | 'settled' | 'archived';
  label: string;
}

const statusColors = {
  active: { bg: '#dff7f5', text: '#34a795' },
  settled: { bg: '#f0f2f4', text: '#7b878f' },
  archived: { bg: '#f0f2f4', text: '#7b878f' },
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const c = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});