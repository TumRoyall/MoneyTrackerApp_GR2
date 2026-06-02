import { ReactNode } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, borderRadius, spacing } from './theme';

// =====================
// MAIN CARD COMPONENT
// =====================

interface CardProps {
  variant?: 'elevated' | 'flat' | 'outlined';
  children: ReactNode;
}

export const Card = ({ variant = 'elevated', children }: CardProps) => {
  const variantStyles = {
    elevated: [styles.elevated],
    flat: styles.flat,
    outlined: styles.outlined,
  };

  return <View style={variantStyles[variant]}>{children}</View>;
};

// =====================
// COMPOUND COMPONENTS
// =====================

Card.Header = ({ title, action }: { title: string; action?: ReactNode }) => (
  <View style={styles.header}>
    <Text style={styles.titleText}>{title}</Text>
    {action && <View style={styles.headerAction}>{action}</View>}
  </View>
);

Card.Body = ({ children }: { children: ReactNode }) => (
  <View>{children}</View>
);

Card.Footer = ({ children }: { children: ReactNode }) => (
  <View style={styles.footer}>{children}</View>
);

// =====================
// STYLES
// =====================

const styles = StyleSheet.create({
  elevated: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  flat: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerAction: {
    marginLeft: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

Card.displayName = 'Card';
