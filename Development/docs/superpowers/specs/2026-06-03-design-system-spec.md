# MoneyTracker Design System Spec

**Date:** 2026-06-03  
**Status:** Approved  
**Scope:** Unify design system for entire app

---

## 1. Design Foundation

### 1.1 Color Palette (Teal-Blue Gradient Professional)

```typescript
const colors = {
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
```

### 1.2 Typography Scale (System Fonts)

```typescript
const typography = {
  font: 'System', // SF Pro / Roboto
  
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 34,
  },
  
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};
```

### 1.3 Spacing Scale (Balanced)

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};
```

---

## 2. Base Components (`@/components/common`)

### 2.1 Button (Flat Props)

```typescript
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
```

**Styles:**
- Primary: bg `#29bcc8`, text white
- Secondary: bg `#e9fbfd`, text `#0f8c95`, border `#29bcc8`
- Ghost: transparent, text `#6c737a`
- Danger: bg `#f36e79`, text white
- Sizes: sm (h40), md (h48), lg (h54)

### 2.2 Card (Compound)

```typescript
<Card variant="elevated" | "flat" | "outlined">
  <Card.Header
    title="Title"
    action={<Button variant="ghost" size="sm" />}
  />
  <Card.Body>content</Card.Body>
  <Card.Footer>actions</Card.Footer>
</Card>
```

**Styles:**
- Elevated: white, shadow, rounded-16
- Flat: white, no shadow
- Outlined: transparent, border

### 2.3 Input (Flat for Simple, Compound for Complex)

```typescript
// Simple
<Input
  label="Label"
  placeholder="..."
  error="Error message"
/>

// Compound for complex forms
<Input>
  <Input.Label>Label</Input.Label>
  <Input.Field placeholder="..." error="..." />
</Input>
```

### 2.4 Modal (Compound)

```typescript
<Modal visible={true}>
  <Modal.Header title="Title" />
  <Modal.Body>content</Modal.Body>
  <Modal.Footer>actions</Modal.Footer>
</Modal>
```

**Styles:**
- Overlay: black 25%
- Sheet: white, rounded-t-24, padding-20

### 2.5 Switch

```typescript
interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
```

### 2.6 FAB

```typescript
interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
}
```

### 2.7 EmptyState

```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    title: string;
    onPress: () => void;
  };
}
```

### 2.8 ProgressBar

```typescript
interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning';
}
```

### 2.9 StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'active' | 'settled' | 'archived';
  label: string;
}
```

### 2.10 BackButton

Circular button 40x40, chevron-back icon, centered.

---

## 3. Layout Patterns

### 3.1 Tool Screen Layout

```
┌─────────────────────────────────┐
│ ← │ Ngân sách           │      │  ← Header row
├─────────────────────────────────┤
│ ☑️ Hiển thị tất cả ví      [ON/OFF]│  ← Toggle row
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  Tổng chi tiêu            │ │  ← Overview card
│ │  2,500,000đ               │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Shopping    / 5,000,000    │ │  ← Tool cards
│ │ ████████░░ 50%            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Food        / 3,000,000    │ │
│ │ ██████████ 80%            │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│                        [+ Thêm] │  ← FAB
└─────────────────────────────────┘
```

### 3.2 Tool Card Structure

```
┌─────────────────────────────┐
│ Title              [✏️]     │  ← Header: title + edit
├─────────────────────────────┤
│ 2,500,000đ / 5,000,000     │  ← Amount row
├─────────────────────────────┤
│ [Chi tiêu]  Còn lại: 2.5M   │  ← Meta row
├─────────────────────────────┤
│ ██████████░░░░░░░ 50%      │  ← Progress bar
└─────────────────────────────┘
```

### 3.3 Detail Screen Layout

```
┌─────────────────────────────────┐
│ ← │   🎉 Birthday Party    │ ⋮│  ← Header
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Tổng quan              │   │ │
│ │ 2,500,000đ | 4 người        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Thành viên              │   │ │
│ │ 👤 Jane  👤 John            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Giao dịch gần đây      │   │ │
│ │ 🍔 500k - Jane              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 4. Component Location

```
src/
├── components/
│   └── common/           # Shared across all app
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Card.Header.tsx
│       ├── Card.Body.tsx
│       ├── Card.Footer.tsx
│       ├── Input.tsx
│       ├── Input.Field.tsx
│       ├── Input.Label.tsx
│       ├── Modal.tsx
│       ├── Modal.Header.tsx
│       ├── Modal.Body.tsx
│       ├── Modal.Footer.tsx
│       ├── Switch.tsx
│       ├── FAB.tsx
│       ├── EmptyState.tsx
│       ├── ProgressBar.tsx
│       ├── StatusBadge.tsx
│       ├── BackButton.tsx
│       ├── theme.ts        # Design tokens
│       └── index.ts
├── modules/
│   └── <module>/
│       └── components/    # Module-specific if needed
│           └── base/
└── shared/
    └── utils/
        └── money.ts
```

---

## 5. Implementation Order

1. **Theme & Design Tokens** - `theme.ts`
2. **Core UI Components** - Button, Card, Input, Modal
3. **Utility Components** - Switch, FAB, EmptyState, ProgressBar
4. **Navigation Components** - BackButton
5. **Apply to Budget Tool** - BudgetToolScreen
6. **Apply to Saving Tool** - SavingToolScreen
7. **Apply to Debt Tool** - DebtToolScreen
8. **Apply to Events Tool** - EventsListScreen, EventDetailScreen
9. **Apply to Other Screens** - Transaction, Wallet, Home, Settings

---

## 6. Migration Strategy

1. Create shared component with same interface
2. Update one screen at a time
3. Keep old styles inline until full migration complete
4. Delete inline styles after migration complete
5. Ensure no visual regression

---

## 7. Success Criteria

- [ ] All screens use `@/components/common`
- [ ] Consistent spacing (16px padding, 12px gap)
- [ ] Consistent colors (teal-blue palette)
- [ ] Consistent typography (system fonts, defined scale)
- [ ] Consistent card layouts
- [ ] Consistent modal styles
- [ ] Consistent empty states
- [ ] Consistent FAB positioning
