import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from './theme';

interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
}

export const FAB = ({ icon, label, onPress }: FABProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.fab,
      label ? styles.fabWithLabel : styles.fabIconOnly,
      pressed && styles.fabPressed,
    ]}
  >
    <View style={styles.iconWrap}>{icon}</View>
    {label && <Text style={styles.label}>{label}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  fabIconOnly: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
  },
  fabWithLabel: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    minHeight: 54,
  },
  fabPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
});