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
      const item = current.find((i) => i.id === id);
      if (!item) return current;
      const nextValue = item.percent + delta;
      const idx = current.findIndex((i) => i.id === id);
      if (idx === -1) return current;
      if (idx === current.length - 1) {
        const clamped = clamp(Math.round(nextValue), 0, 100);
        const next = [...current];
        next[idx] = { id, percent: clamped };
        return next;
      }
      const clamped = clamp(Math.round(nextValue), 0, 100);
      const diff = clamped - item.percent;
      const next = current.map((it, i) => {
        if (i === idx) return { id, percent: clamped };
        if (i === current.length - 1) {
          return { id: it.id, percent: clamp(it.percent - diff, 0, 100) };
        }
        return it;
      });
      return next;
    });
  }, []);

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
