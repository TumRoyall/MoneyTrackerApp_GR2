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
