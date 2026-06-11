# MoneyTracker Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement unified design system across entire MoneyTracker app with shared components in `@/components/common`

**Architecture:** Bottom-up approach - create shared components first, then migrate screens one by one. Components use flat props for simple components and compound pattern for complex components with structured layouts.

**Tech Stack:** React Native, Expo, TypeScript, @tanstack/react-query, expo-router

---

## File Structure

```
app_moneytracker/src/
├── components/
│   └── common/
│       ├── theme.ts           # Design tokens (colors, spacing, typography)
│       ├── Button.tsx         # Primary UI button
│       ├── Card.tsx           # Base card + compound (Header, Body, Footer)
│       ├── Input.tsx          # Base input + compound
│       ├── Modal.tsx          # Modal + compound
│       ├── Switch.tsx         # Toggle switch
│       ├── FAB.tsx            # Floating action button
│       ├── EmptyState.tsx     # Empty state placeholder
│       ├── ProgressBar.tsx     # Progress indicator
│       ├── StatusBadge.tsx    # Status label badge
│       ├── BackButton.tsx     # Circular back button
│       └── index.ts            # Export all components
```

---

## Phase 1: Foundation

### Task 1: Create Theme & Design Tokens

**Files:**
- Create: `app_moneytracker/src/components/common/theme.ts`

```typescript
import { StyleSheet } from 'react-native';

export const colors = {
  // Primary Brand
  primary: '#29bcc8',
  primaryDark: '#1E8A8F',
  primaryLight: '#E8F7F9',
  
  // Secondary
  secondary: '#1E6B7C',
  secondaryDark: '#152F3D',
  secondaryLight: '#EDF4F7',
  
  // Accent
  accent: '#33c3cd',
  success: '#34A853',
  error: '#F36E79',
  warning: '#F5A623',
  
  // Neutrals
  bgPrimary: '#F5F7F9',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F0F2F4',
  
  // Text
  textPrimary: '#1F1F1F',
  textSecondary: '#6C737A',
  textTertiary: '#8B8B8B',
  textInverse: '#FFFFFF',
  
  // Borders
  borderLight: '#E8EBEF',
  borderMedium: '#D8DDE3',
  borderDark: '#C5CBD1',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 34,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 16,
    elevation: 6,
  },
});
```

- [ ] **Step 1: Create theme.ts file with design tokens**

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/components/common/theme.ts
git commit -m "feat(ui): add design system theme tokens"
```

---

## Phase 2: Core UI Components

### Task 2: Create Button Component

**Files:**
- Create: `app_moneytracker/src/components/common/Button.tsx`

```typescript
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
```

- [ ] **Step 1: Create Button component**

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/components/common/Button.tsx
git commit -m "feat(ui): add Button component"
```

---

### Task 3: Create Card Component (Compound)

**Files:**
- Create: `app_moneytracker/src/components/common/Card.tsx`

```typescript
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, borderRadius, spacing } from './theme';

// =====================
// SUB-COMPONENTS
// =====================

const CardContent = ({ children, style }: { children: ReactNode; style?: any }) => (
  <View style={style}>{children}</View>
);

CardContent.displayName = 'CardContent';

// =====================
// MAIN CARD COMPONENT
// =====================

interface CardProps {
  variant?: 'elevated' | 'flat' | 'outlined';
  children: ReactNode;
}

export const Card = ({ variant = 'elevated', children }: CardProps) => {
  const variantStyles = {
    elevated: [styles.elevated, styles.shadow],
    flat: styles.flat,
    outlined: styles.outlined,
  };

  return <View style={variantStyles[variant]}>{children}</View>;
};

Card.Header = ({ title, action }: { title: string; action?: ReactNode }) => (
  <View style={styles.header}>
    <View style={styles.headerTitle}>
      <CardContent>
        <View style={styles.titleText}>{title}</View>
      </CardContent>
    </View>
    {action && <View style={styles.headerAction}>{action}</View>}
  </View>
);

Card.Body = ({ children }: { children: ReactNode }) => (
  <View style={styles.body}>{children}</View>
);

Card.Footer = ({ children }: { children: ReactNode }) => (
  <View style={styles.footer}>{children}</View>
);

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
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerAction: {
    marginLeft: spacing.sm,
  },
  body: {
    // Default body styles
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

Card.displayName = 'Card';
```

- [ ] **Step 1: Create Card component with compound pattern**

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/components/common/Card.tsx
git commit -m "feat(ui): add Card component (compound)"
```

---

### Task 4: Create Input Component

**Files:**
- Create: `app_moneytracker/src/components/common/Input.tsx`

```typescript
import { ReactNode } from 'react';
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
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
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
```

- [ ] **Step 1: Create Input component**

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/components/common/Input.tsx
git commit -m "feat(ui): add Input component"
```

---

### Task 5: Create Modal Component

**Files:**
- Create: `app_moneytracker/src/components/common/Modal.tsx`

```typescript
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

Modal.Header = ({ title, onClose }: { title: string; onClose?: () => void }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    {onClose && (
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </Pressable>
    )}
  </View>
);

Modal.Body = ({ children }: { children: ReactNode }) => (
  <View style={styles.content}>{children}</View>
);

Modal.Footer = ({ children }: { children: ReactNode }) => (
  <View style={styles.footer}>{children}</View>
);

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
```

- [ ] **Step 1: Create Modal component**

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/components/common/Modal.tsx
git commit -m "feat(ui): add Modal component"
```

---

## Phase 3: Utility Components

### Task 6: Create Switch, FAB, EmptyState, ProgressBar, StatusBadge, BackButton

**Files:**
- Create: `app_moneytracker/src/components/common/Switch.tsx`
- Create: `app_moneytracker/src/components/common/FAB.tsx`
- Create: `app_moneytracker/src/components/common/EmptyState.tsx`
- Create: `app_moneytracker/src/components/common/ProgressBar.tsx`
- Create: `app_moneytracker/src/components/common/StatusBadge.tsx`
- Create: `app_moneytracker/src/components/common/BackButton.tsx`
- Modify: `app_moneytracker/src/components/common/index.ts`

```typescript
// Switch.tsx
import { Switch as RNSwitch } from 'react-native';
import { colors } from './theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Switch = ({ value, onValueChange, disabled }: SwitchProps) => (
  <RNSwitch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#d4dde3', true: colors.accent }}
    thumbColor={value ? '#ffffff' : '#f1f5f8'}
  />
);
```

```typescript
// FAB.tsx
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
```

```typescript
// EmptyState.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from './theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    title: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
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
  icon: {
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
  actionIcon: {
    // Icon wrapper
  },
  actionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
```

```typescript
// ProgressBar.tsx
import { StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, typography } from './theme';

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning';
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
```

```typescript
// StatusBadge.tsx
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
```

```typescript
// BackButton.tsx
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  to?: string; // Optional route, defaults to back()
}

export const BackButton = ({ to }: BackButtonProps) => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => (to ? router.replace(to) : router.back())}
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={24} color="#1f1f1f" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 1: Create Switch component**

- [ ] **Step 2: Create FAB component**

- [ ] **Step 3: Create EmptyState component**

- [ ] **Step 4: Create ProgressBar component**

- [ ] **Step 5: Create StatusBadge component**

- [ ] **Step 6: Create BackButton component**

- [ ] **Step 7: Create index.ts with all exports**

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Modal } from './Modal';
export { Switch } from './Switch';
export { FAB } from './FAB';
export { EmptyState } from './EmptyState';
export { ProgressBar } from './ProgressBar';
export { StatusBadge } from './StatusBadge';
export { BackButton } from './BackButton';
export { colors, spacing, borderRectadius, typography, shadows } from './theme';
```

- [ ] **Step 8: Commit all utility components**

```bash
git add app_moneytracker/src/components/common/
git commit -m "feat(ui): add utility components (Switch, FAB, EmptyState, ProgressBar, StatusBadge, BackButton)"
```

---

## Phase 4: Migrate Tool Screens

### Task 7: Migrate BudgetToolScreen

**Files:**
- Modify: `app_moneytracker/src/modules/budget/screens/BudgetToolScreen.tsx`

Changes:
- Replace inline Button styles with `<Button>` component
- Replace inline Card styles with `<Card>` component
- Replace inline ProgressBar with `<ProgressBar>` component
- Replace inline EmptyState with `<EmptyState>` component
- Replace FAB with `<FAB>` component
- Replace Switch with `<Switch>` component
- Standardize spacing to theme values

- [ ] **Step 1: Import shared components**

- [ ] **Step 2: Replace inline button styles**

- [ ] **Step 3: Replace card components**

- [ ] **Step 4: Replace FAB**

- [ ] **Step 5: Replace EmptyState**

- [ ] **Step 6: Replace Switch**

- [ ] **Step 7: Update spacing to use theme**

- [ ] **Step 8: Commit**

```bash
git add app_moneytracker/src/modules/budget/screens/BudgetToolScreen.tsx
git commit -m "refactor(budget): migrate to shared design system"
```

---

### Task 8: Migrate SavingToolScreen

**Files:**
- Modify: `app_moneytracker/src/modules/saving/screens/SavingToolScreen.tsx`

Same changes as Task 7.

- [ ] **Migrate SavingToolScreen like Task 7**

- [ ] **Commit**

---

### Task 9: Migrate DebtToolScreen

**Files:**
- Modify: `app_moneytracker/src/modules/debt/screens/DebtToolScreen.tsx`

Same changes as Task 7.

- [ ] **Migrate DebtToolScreen like Task 7**

- [ ] **Commit**

---

### Task 10: Migrate EventsListScreen

**Files:**
- Modify: `app_moneytracker/app/(tabs)/tools/events/index.tsx`

Same changes as Task 7.

- [ ] **Migrate EventsListScreen like Task 7**

- [ ] **Commit**

---

### Task 11: Migrate Detail Screens

**Files:**
- Modify: `app_moneytracker/src/modules/budget/screens/BudgetDetailScreen.tsx` (backup: `.js` exists)
- Modify: `app_moneytracker/src/modules/saving/screens/SavingDetailScreen.tsx`
- Modify: `app_moneytracker/src/modules/debt/screens/DebtDetailScreen.tsx`
- Modify: `app_moneytracker/app/(tabs)/tools/events/[eventId]/index.tsx`

Changes: Same as Task 7 but for detail views. Key: Replace `router.back()` with `BackButton` component.

- [ ] **Migrate all detail screens like Task 7**

- [ ] **Commit**

---

## Phase 5: Migrate Other Screens

### Task 12: Migrate Remaining Screens

**Files:**
- Transaction screens
- Wallet screens
- Home/Wallets screen
- Settings screen

Apply same migration pattern as previous tasks.

- [ ] **Migrate remaining screens one by one**

- [ ] **Commit each**

---

## Self-Review Checklist

- [ ] All components created with correct interfaces
- [ ] Theme values used consistently (colors, spacing, typography)
- [ ] Card compound pattern working correctly
- [ ] Modal compound pattern working correctly
- [ ] No inline styles remaining in migrated screens
- [ ] All exports in index.ts

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-design-system-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
