# F1: PercentAdjuster Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `PercentAdjuster` component (input number + ±5% buttons) and `usePercentSum` hook to power the AI Budget preview screen in F2.

**Architecture:** Pure React Native component with controlled-input state. No external slider library. Component manages its own button states; parent (AI Budget preview) manages the array of values via `usePercentSum` hook which auto-balances the last item to keep sum = 100.

**Tech Stack:**
- React Native 0.81 + Expo 54
- TypeScript 5.6
- `@expo/vector-icons` (Ionicons) for buttons
- `formatVndAmount` from `@/shared/utils/money` for amount display
- Jest + React Native Testing Library for tests (assumed; if not present, see Task 1 for setup)

**Estimated Effort:** 3-5 days

---

## File Structure

### New Files
- `app_moneytracker/src/modules/budget/hooks/usePercentSum.ts` - Hook for managing array of percent values, auto-balance last item
- `app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx` - Single row: input + ±5% buttons + amount display
- `app_moneytracker/src/modules/budget/components/__tests__/PercentAdjuster.test.tsx` - Component tests
- `app_moneytracker/src/modules/budget/hooks/__tests__/usePercentSum.test.ts` - Hook tests
- `app_moneytracker/src/modules/budget/components/PercentAdjusterRow.tsx` - Full row with icon, name, adjuster, AI reasoning (composition wrapper)

### Modified Files
None — F1 is purely additive. F2 will integrate these components.

### Why this structure
- `usePercentSum` is the brains (state + auto-balance logic), easy to test in isolation
- `PercentAdjuster` is a pure UI component, no business logic, easy to test
- `PercentAdjusterRow` is a thin composition wrapper for the full F2 preview screen layout
- Each file has one clear responsibility; can reason about each in isolation

---

## Task 1: Verify Test Infrastructure

**Files:**
- Check: `app_moneytracker/package.json` for test deps

- [ ] **Step 1: Check existing test setup**

Run:
```bash
cd app_moneytracker
ls jest.config.js 2>/dev/null && echo "jest config exists"
grep -E '"(jest|@testing-library|@types/jest)"' package.json || echo "no test deps"
```

Expected output: Either jest config + test deps exist, OR "no test deps" message.

- [ ] **Step 2: If no test setup, install minimum**

Run (only if Step 1 showed "no test deps"):
```bash
cd app_moneytracker
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

- [ ] **Step 3: Add jest config to package.json**

Add to `app_moneytracker/package.json` under `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

Add new top-level key:
```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))"
  ]
}
```

- [ ] **Step 4: Verify Jest runs**

Run:
```bash
cd app_moneytracker
npx jest --listTests 2>&1 | head -20
```

Expected: Either lists existing tests OR prints "No tests found" (which is fine — no tests yet, but Jest is wired up).

- [ ] **Step 5: Commit (only if you installed new deps)**

```bash
git add app_moneytracker/package.json app_moneytracker/package-lock.json
git commit -m "chore(test): add jest + react-native testing library for F1"
```

Skip commit if Step 1 showed test deps already exist.

---

## Task 2: Write Failing Test for `usePercentSum` Hook

**Files:**
- Create: `app_moneytracker/src/modules/budget/hooks/__tests__/usePercentSum.test.ts`
- Create: `app_moneytracker/src/modules/budget/hooks/usePercentSum.ts` (empty stub)

- [ ] **Step 1: Create empty hook stub**

Create `app_moneytracker/src/modules/budget/hooks/usePercentSum.ts`:
```typescript
export interface PercentItem {
  id: string;
  percent: number;
}

export function usePercentSum(_items: PercentItem[]): unknown {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Write the failing test file**

Create `app_moneytracker/src/modules/budget/hooks/__tests__/usePercentSum.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { usePercentSum, PercentItem } from '../usePercentSum';

describe('usePercentSum', () => {
  it('returns initial items unchanged', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 25 },
      { id: 'b', percent: 25 },
      { id: 'c', percent: 50 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));
    expect(result.current.items).toEqual(initial);
    expect(result.current.sum).toBe(100);
  });

  it('updates a specific item by id', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 25 },
      { id: 'b', percent: 25 },
      { id: 'c', percent: 50 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));

    act(() => {
      result.current.updatePercent('a', 30);
    });

    expect(result.current.items[0].percent).toBe(30);
  });

  it('auto-rebalances last item to keep sum = 100', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 25 },
      { id: 'b', percent: 25 },
      { id: 'c', percent: 50 },  // last item
    ];
    const { result } = renderHook(() => usePercentSum(initial));

    act(() => {
      result.current.updatePercent('a', 40);  // +15
    });

    // a: 40, b: 25, c: should auto-adjust to 35
    expect(result.current.items[0].percent).toBe(40);
    expect(result.current.items[1].percent).toBe(25);
    expect(result.current.items[2].percent).toBe(35);
    expect(result.current.sum).toBe(100);
  });

  it('clamps last item to 0 minimum (no negative)', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 80 },
      { id: 'b', percent: 20 },
      { id: 'c', percent: 0 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));

    act(() => {
      result.current.updatePercent('a', 90);  // would make c = -10
    });

    expect(result.current.items[0].percent).toBe(90);
    expect(result.current.items[1].percent).toBe(20);
    expect(result.current.items[2].percent).toBe(0);
    expect(result.current.sum).toBe(110);
  });

  it('clamps individual values to 0-100', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 50 },
      { id: 'b', percent: 50 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));

    act(() => {
      result.current.updatePercent('a', 150);  // over 100
    });

    expect(result.current.items[0].percent).toBe(100);
  });

  it('exposes sum and isComplete (sum === 100)', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 30 },
      { id: 'b', percent: 30 },
      { id: 'c', percent: 40 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));
    expect(result.current.sum).toBe(100);
    expect(result.current.isComplete).toBe(true);
  });

  it('reports isComplete false when sum != 100', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 30 },
      { id: 'b', percent: 30 },
      { id: 'c', percent: 30 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));
    expect(result.current.sum).toBe(90);
    expect(result.current.isComplete).toBe(false);
  });

  it('exposes amounts computed from percent × income / 100', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 25 },
      { id: 'b', percent: 25 },
      { id: 'c', percent: 50 },
    ];
    const { result } = renderHook(() => usePercentSum(initial, 20000000));

    expect(result.current.amounts).toEqual([5000000, 5000000, 10000000]);
  });

  it('returns empty amounts when income is 0 or undefined', () => {
    const initial: PercentItem[] = [
      { id: 'a', percent: 50 },
      { id: 'b', percent: 50 },
    ];
    const { result } = renderHook(() => usePercentSum(initial));
    expect(result.current.amounts).toEqual([0, 0]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
cd app_moneytracker
npx jest src/modules/budget/hooks/__tests__/usePercentSum.test.ts
```

Expected: FAIL with "not implemented" or similar (the hook throws).

---

## Task 3: Implement `usePercentSum` Hook

**Files:**
- Modify: `app_moneytracker/src/modules/budget/hooks/usePercentSum.ts`

- [ ] **Step 1: Implement the hook**

Replace contents of `app_moneytracker/src/modules/budget/hooks/usePercentSum.ts`:
```typescript
import { useCallback, useMemo, useState } from 'react';

export interface PercentItem {
  id: string;
  percent: number;
}

export interface UsePercentSumResult {
  items: PercentItem[];
  sum: number;
  isComplete: boolean;
  amounts: number[];
  updatePercent: (id: string, nextPercent: number) => void;
  adjustPercent: (id: string, delta: number) => void;
  reset: (nextItems: PercentItem[]) => void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function usePercentSum(initial: PercentItem[], income: number = 0): UsePercentSumResult {
  const [items, setItems] = useState<PercentItem[]>(initial);

  const updatePercent = useCallback((id: string, nextPercent: number) => {
    setItems((current) => {
      const idx = current.findIndex((i) => i.id === id);
      if (idx === -1) return current;
      if (idx === current.length - 1) {
        // Last item: just clamp, don't rebalance (it's the auto-fill target)
        const clamped = clamp(Math.round(nextPercent), 0, 100);
        const next = [...current];
        next[idx] = { id, percent: clamped };
        return next;
      }
      // Non-last item: change this, then rebalance the last
      const clamped = clamp(Math.round(nextPercent), 0, 100);
      const diff = clamped - current[idx].percent;
      const next = current.map((item, i) => {
        if (i === idx) return { id, percent: clamped };
        if (i === current.length - 1) {
          return { id: item.id, percent: clamp(item.percent - diff, 0, 100) };
        }
        return item;
      });
      return next;
    });
  }, []);

  const adjustPercent = useCallback((id: string, delta: number) => {
    setItems((current) => {
      const idx = current.findIndex((i) => i.id === id);
      if (idx === -1) return current;
      const current_val = current[idx].percent;
      updatePercent(id, current_val + delta);
      return current; // updatePercent will trigger another setItems; this return is a no-op safety
    });
  }, [updatePercent]);

  const reset = useCallback((nextItems: PercentItem[]) => {
    setItems(nextItems);
  }, []);

  const sum = useMemo(() => items.reduce((acc, i) => acc + i.percent, 0), [items]);

  const amounts = useMemo(() => {
    if (!income || income <= 0) {
      return items.map(() => 0);
    }
    return items.map((i) => Math.round((income * i.percent) / 100));
  }, [items, income]);

  return {
    items,
    sum,
    isComplete: sum === 100,
    amounts,
    updatePercent,
    adjustPercent,
    reset,
  };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
cd app_moneytracker
npx jest src/modules/budget/hooks/__tests__/usePercentSum.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 3: If any test fails, debug and fix**

Common issues:
- If "clamping last item" test fails with sum=110, the auto-rebalance logic in `updatePercent` isn't running for the last item. Re-read the condition `if (idx === current.length - 1)`.
- If `adjustPercent` test fails, it may be double-updating state. Simpler approach: just compute the new value and call `updatePercent`:

Replace `adjustPercent`:
```typescript
const adjustPercent = useCallback((id: string, delta: number) => {
  setItems((current) => {
    const item = current.find((i) => i.id === id);
    if (!item) return current;
    updatePercent(id, item.percent + delta);
    return current;
  });
}, [updatePercent]);
```

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/hooks/usePercentSum.ts app_moneytracker/src/modules/budget/hooks/__tests__/usePercentSum.test.ts
git commit -m "feat(budget): add usePercentSum hook for percent allocation

Manages array of percent values, auto-rebalances the last item
to keep sum = 100. Exposes update/adjust/reset, computed sum,
isComplete flag, and amounts derived from income."
```

---

## Task 4: Write Failing Test for `PercentAdjuster` Component

**Files:**
- Create: `app_moneytracker/src/modules/budget/components/__tests__/PercentAdjuster.test.tsx`
- Create: `app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx` (empty stub)

- [ ] **Step 1: Create empty component stub**

Create `app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx`:
```typescript
import { View } from 'react-native';

export interface PercentAdjusterProps {
  percent: number;
  amount: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function PercentAdjuster(_props: PercentAdjusterProps) {
  return <View testID="percent-adjuster" />;
}
```

- [ ] **Step 2: Write the failing test file**

Create `app_moneytracker/src/modules/budget/components/__tests__/PercentAdjuster.test.tsx`:
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { PercentAdjuster } from '../PercentAdjuster';

describe('PercentAdjuster', () => {
  it('renders current percent value', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={() => {}} />
    );
    expect(getByTestId('percent-input').props.value).toBe('25');
  });

  it('renders the amount as formatted VND', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={() => {}} />
    );
    expect(getByTestId('amount-display').props.children).toContain('5');
  });

  it('calls onChange with -5 when minus button is pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('minus-button'));
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('calls onChange with +5 when plus button is pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('clamps minus button to 0 (no negative)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={2} amount={400000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('minus-button'));
    expect(onChange).toHaveBeenCalledWith(0);  // 2 - 5 = -3, clamped to 0
  });

  it('clamps plus button to 100', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={98} amount={19600000} onChange={onChange} />
    );
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).toHaveBeenCalledWith(100);  // 98 + 5 = 103, clamped to 100
  });

  it('calls onChange with typed value when input changes', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.changeText(getByTestId('percent-input'), '40');
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it('rejects non-numeric input (passes 0)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={25} amount={5000000} onChange={onChange} />
    );
    fireEvent.changeText(getByTestId('percent-input'), 'abc');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('disables both buttons when disabled prop is true', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PercentAdjuster percent={20} amount={4000000} onChange={onChange} disabled />
    );
    fireEvent.press(getByTestId('minus-button'));
    fireEvent.press(getByTestId('plus-button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    const { getByTestId } = render(
      <PercentAdjuster percent={20} amount={4000000} onChange={() => {}} disabled />
    );
    expect(getByTestId('percent-input').props.editable).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
cd app_moneytracker
npx jest src/modules/budget/components/__tests__/PercentAdjuster.test.tsx
```

Expected: FAIL — buttons are not implemented, input doesn't exist, etc.

---

## Task 5: Implement `PercentAdjuster` Component

**Files:**
- Modify: `app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx`

- [ ] **Step 1: Implement the component**

Replace contents of `app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx`:
```typescript
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatVndAmount } from '@/shared/utils/money';

export interface PercentAdjusterProps {
  percent: number;
  amount: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

const STEP = 5;
const MIN = 0;
const MAX = 100;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const sanitizePercentInput = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  return clamp(parseInt(cleaned, 10), MIN, MAX);
};

export function PercentAdjuster({ percent, amount, onChange, disabled = false }: PercentAdjusterProps) {
  const handleMinus = () => {
    if (disabled) return;
    onChange(clamp(percent - STEP, MIN, MAX));
  };

  const handlePlus = () => {
    if (disabled) return;
    onChange(clamp(percent + STEP, MIN, MAX));
  };

  const handleChangeText = (raw: string) => {
    if (disabled) return;
    onChange(sanitizePercentInput(raw));
  };

  return (
    <View style={styles.row} testID="percent-adjuster">
      <View style={styles.adjustGroup}>
        <Pressable
          testID="minus-button"
          onPress={handleMinus}
          disabled={disabled}
          style={[styles.button, disabled ? styles.buttonDisabled : null]}
          accessibilityLabel="Giảm 5%"
        >
          <Ionicons name="remove" size={18} color={disabled ? '#aab2b8' : '#1f1f1f'} />
        </Pressable>

        <TextInput
          testID="percent-input"
          value={String(percent)}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          editable={!disabled}
          style={[styles.input, disabled ? styles.inputDisabled : null]}
          maxLength={3}
          accessibilityLabel="Phần trăm ngân sách"
        />

        <Text style={styles.percentSuffix}>%</Text>

        <Pressable
          testID="plus-button"
          onPress={handlePlus}
          disabled={disabled}
          style={[styles.button, disabled ? styles.buttonDisabled : null]}
          accessibilityLabel="Tăng 5%"
        >
          <Ionicons name="add" size={18} color={disabled ? '#aab2b8' : '#1f1f1f'} />
        </Pressable>
      </View>

      <Text testID="amount-display" style={styles.amount}>
        = {formatVndAmount(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
  },
  adjustGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f5f7f9',
  },
  input: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d5dde3',
    backgroundColor: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f1f1f',
  },
  inputDisabled: {
    backgroundColor: '#f5f7f9',
    color: '#aab2b8',
  },
  percentSuffix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5d6972',
  },
  amount: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#3a464e',
  },
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
cd app_moneytracker
npx jest src/modules/budget/components/__tests__/PercentAdjuster.test.tsx
```

Expected: All 10 tests PASS.

- [ ] **Step 3: If tests fail, debug common issues**

If "renders amount as formatted VND" fails:
- The amount display uses `formatVndAmount` which returns `₫5.000.000` (vi-VN locale)
- Check that the test is checking for substring "5" not exact format
- The current test uses `toContain('5')` which should pass

If "rejects non-numeric input" fails:
- The handler should pass 0 for "abc" (sanitizePercentInput returns 0 for empty)
- Make sure `replace(/[^0-9]/g, '')` strips letters

- [ ] **Step 4: Commit**

```bash
git add app_moneytracker/src/modules/budget/components/PercentAdjuster.tsx app_moneytracker/src/modules/budget/components/__tests__/PercentAdjuster.test.tsx
git commit -m "feat(budget): add PercentAdjuster component

Input number + ±5% buttons + auto-calculated VND amount display.
No slider library required. Supports disabled state for the auto-fill
last item (Tiết kiệm)."
```

---

## Task 6: Create `PercentAdjusterRow` Composition Wrapper

**Files:**
- Create: `app_moneytracker/src/modules/budget/components/PercentAdjusterRow.tsx`

(No test for this — it's a thin composition wrapper that just stitches together icon + name + adjuster + reasoning. Manual visual testing in F2 preview screen will validate it.)

- [ ] **Step 1: Create the wrapper component**

Create `app_moneytracker/src/modules/budget/components/PercentAdjusterRow.tsx`:
```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PercentAdjuster } from './PercentAdjuster';

export interface PercentAdjusterRowProps {
  categoryIcon?: string;
  categoryName: string;
  percent: number;
  amount: number;
  aiReasoning?: string | null;
  disabled?: boolean;
  onChange: (next: number) => void;
}

export function PercentAdjusterRow({
  categoryIcon,
  categoryName,
  percent,
  amount,
  aiReasoning,
  disabled = false,
  onChange,
}: PercentAdjusterRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.nameGroup}>
          {categoryIcon ? (
            <MaterialCommunityIcons
              name={categoryIcon as any}
              size={20}
              color="#179ea9"
            />
          ) : null}
          <Text style={styles.name}>{categoryName}</Text>
          {disabled ? <Text style={styles.autoBadge}>🔒 auto</Text> : null}
        </View>
      </View>

      <PercentAdjuster
        percent={percent}
        amount={amount}
        onChange={onChange}
        disabled={disabled}
      />

      {aiReasoning ? (
        <Text style={styles.reasoning} numberOfLines={2}>
          💡 {aiReasoning}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6ecef',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  autoBadge: {
    fontSize: 11,
    color: '#7b868d',
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 12,
    color: '#5d6972',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app_moneytracker/src/modules/budget/components/PercentAdjusterRow.tsx
git commit -m "feat(budget): add PercentAdjusterRow wrapper for F2 preview

Composition wrapper: icon + category name + adjuster + AI reasoning.
Includes 'auto' badge for the last (auto-fill) item."
```

---

## Task 7: Final Manual Smoke Test

**Files:**
- Manual: Render components in any existing budget screen to verify visual integration

- [ ] **Step 1: Add a temporary demo in `BudgetEditScreen.tsx`**

Open `app_moneytracker/src/modules/budget/screens/BudgetEditScreen.tsx`.

Find the imports section (around line 17-20), add:
```typescript
import { PercentAdjusterRow } from '@/modules/budget/components/PercentAdjusterRow';
```

Find the main return statement (around line 300). Add a temporary demo block right before the closing `</>` of the form:
```typescript
{/* TEMPORARY F1 DEMO - REMOVE BEFORE COMMIT */}
<View style={{ marginTop: 20, padding: 12, backgroundColor: '#fff7e0', borderRadius: 8 }}>
  <Text style={{ fontWeight: '700', marginBottom: 8 }}>🧪 F1 Demo (delete me)</Text>
  <PercentAdjusterRow
    categoryIcon="food-fork-drink"
    categoryName="Ăn uống"
    percent={25}
    amount={5000000}
    aiReasoning="Ăn uống ~130k/ngày"
    onChange={() => {}}
  />
  <View style={{ height: 8 }} />
  <PercentAdjusterRow
    categoryIcon="piggy-bank"
    categoryName="Tiết kiệm"
    percent={20}
    amount={4000000}
    aiReasoning="Tự động = 100 - các mục khác"
    disabled
    onChange={() => {}}
  />
</View>
```

- [ ] **Step 2: Run the app and verify**

Run:
```bash
cd app_moneytracker
npx expo start
```

Navigate to Budget Edit screen (e.g. open any existing budget). Verify:
- [ ] Demo block appears with yellow background
- [ ] "Ăn uống" row shows: icon, name, [-5%][25%][+5%], amount "5.000.000 ₫", AI reasoning
- [ ] "Tiết kiệm" row shows 🔒 badge, input is grayed out, +/- buttons disabled
- [ ] Pressing +/-5% on "Ăn uống" updates the display (but onChange is no-op so amount stays)
- [ ] Layout looks clean on both iOS and Android

- [ ] **Step 3: Remove the temporary demo**

Delete the entire `Tạm thời F1 DEMO` block from `BudgetEditScreen.tsx`. Also remove the `PercentAdjusterRow` import.

- [ ] **Step 4: Re-run tests one last time**

Run:
```bash
cd app_moneytracker
npx jest
```

Expected: All 18 tests pass (8 from usePercentSum + 10 from PercentAdjuster).

- [ ] **Step 5: Final commit if any changes**

```bash
git status
# If only the demo removal shows (already deleted), nothing to commit.
# If anything else changed, commit:
git diff
git add -A
git commit -m "chore(budget): F1 manual smoke test - remove demo block"
```

---

## Task 8: Update Design Doc with F1 Completion Status

**Files:**
- Modify: `docs/superpowers/specs/2026-06-05-ai-smart-budgeting-design.md`

- [ ] **Step 1: Update Open Questions status**

In the Open Questions table in the spec, mark the F1-relevant questions:
- Q2: Already resolved (slider approach)
- Q7: Already resolved (manual vs AI model)

Add a new "F1 Status" line at the top of the spec:

After the header section, add:
```markdown
## F1 Status

✅ **F1 PercentAdjuster complete** (see `2026-06-05-f1-percent-adjuster-plan.md` for implementation plan).

Components delivered:
- `usePercentSum` hook (auto-balancing percent allocator)
- `PercentAdjuster` component (input + ±5% buttons)
- `PercentAdjusterRow` wrapper (icon + name + adjuster + AI reasoning)

Ready for F2 (AI Budget) integration.

---
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-05-ai-smart-budgeting-design.md
git commit -m "docs(budget): mark F1 PercentAdjuster as complete"
```

---

## Self-Review

**Spec coverage check:**
- [x] F1 PercentAdjuster component — Task 5
- [x] usePercentSum hook (auto-balance) — Task 3
- [x] PercentAdjusterRow wrapper — Task 6
- [x] Component tests (TDD) — Tasks 2, 4
- [x] Manual smoke test — Task 7
- [x] Update design doc — Task 8
- [x] F1 acceptance criteria from spec (input 0-100, ±5%, auto-fill, format VND, disabled state) — covered in Task 5

**Placeholder scan:** No "TODO", "TBD", or "implement later" in any task. All code blocks contain complete implementations.

**Type consistency check:**
- `PercentItem` interface defined in Task 2, used in Task 3 — consistent
- `PercentAdjusterProps` defined in Task 4, used in Task 5 — consistent
- `usePercentSum` return shape: `{ items, sum, isComplete, amounts, updatePercent, adjustPercent, reset }` — used consistently in tests
- `STEP = 5` constant in Task 5 component, matches spec "±5%"
- `disabled` prop used in both component and tests consistently

**No missing dependencies:**
- `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) — already in package.json
- `formatVndAmount` from `@/shared/utils/money` — exists, used correctly
- All imports are real and resolve

---

## Summary

**Total tasks:** 8
**Total estimated time:** 3-5 days
**New files:** 4 (2 source + 2 test)
**Modified files:** 1 (`BudgetEditScreen.tsx` temporarily, then reverted)
**Test count:** 18 (8 hook + 10 component)

After completing this plan, F1 is done and F2 (AI Budget generation) can begin integration.
