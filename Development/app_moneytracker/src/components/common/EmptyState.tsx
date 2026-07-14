import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from './theme';
import { CategoryIcon } from './CategoryIcon';

type IoniconsIconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconsIconName | string;
  iconLibrary?: 'ionicons' | 'lucide';
  title: string;
  description: string;
  action?: {
    title: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
}

export const EmptyState = ({ icon, iconLibrary = 'ionicons', title, description, action }: EmptyStateProps) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      {iconLibrary === 'lucide' ? (
        <CategoryIcon icon={icon as string} size={56} color="#b0bec5" />
      ) : (
        <Ionicons name={icon as IoniconsIconName} size={56} color="#b0bec5" />
      )}
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {action && (
      <Pressable style={styles.actionBtn} onPress={action.onPress}>
        {action.icon && <View style={styles.actionIcon}>{action.icon}</View>}
        <Text style={styles.actionText}>{action.title}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: 64,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  actionIcon: {},
  actionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});