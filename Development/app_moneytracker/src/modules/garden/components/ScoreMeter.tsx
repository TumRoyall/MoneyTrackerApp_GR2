import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GardenScore } from '@/modules/garden/models/garden.types';

type ScoreMeterProps = {
  score: GardenScore;
};

export const ScoreMeter = memo(({ score }: ScoreMeterProps) => {
  const clamped = Math.max(0, Math.min(100, score.value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{score.label}</Text>
        <Text style={styles.value}>{clamped}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b6f74',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#1f1f1f',
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 99,
    backgroundColor: '#edf0f4',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#58c9d2',
  },
});
