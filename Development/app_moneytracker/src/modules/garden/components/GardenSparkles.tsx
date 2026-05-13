import { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { usePulseAnimation } from '@/modules/garden/components/hooks/usePulseAnimation';

type GardenSparklesProps = {
  color: string;
  intensity?: number;
};

const sparklePositions = [
  { left: '12%', top: '20%', size: 6 },
  { left: '78%', top: '16%', size: 5 },
  { left: '60%', top: '32%', size: 4 },
  { left: '20%', top: '38%', size: 5 },
  { left: '10%', top: '60%', size: 4 },
  { left: '82%', top: '58%', size: 6 },
];

export const GardenSparkles = memo(({ color, intensity = 1 }: GardenSparklesProps) => {
  const pulse = usePulseAnimation(0.3, 1, 3200);
  const opacity = useMemo(() => pulse.interpolate({ inputRange: [0.3, 1], outputRange: [0.2, 0.8] }), [pulse]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {sparklePositions.map((sparkle, index) => (
        <Animated.View
          key={`sparkle-${index}`}
          style={[
            styles.sparkle,
            {
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size * intensity,
              height: sparkle.size * intensity,
              borderRadius: (sparkle.size * intensity) / 2,
              backgroundColor: color,
              opacity,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
  },
});
