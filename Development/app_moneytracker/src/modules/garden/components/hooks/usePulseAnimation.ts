import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const usePulseAnimation = (min = 0.6, max = 1, duration = 2400) => {
  const value = useRef(new Animated.Value(max)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [duration, max, min, value]);

  return value;
};
