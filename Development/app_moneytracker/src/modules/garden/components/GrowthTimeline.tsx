import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GardenMonthlyReport } from '@/modules/garden/models/garden.types';

const stageLabel: Record<GardenMonthlyReport['replay'][number]['stage'], string> = {
  Seed: 'Hạt',
  Sprout: 'Mầm',
  YoungPlant: 'Cây non',
  GrowingPlant: 'Cây lớn',
  Budding: 'Nụ',
  Blooming: 'Nở hoa',
};

export const GrowthTimeline = memo(({ replay }: { replay: GardenMonthlyReport['replay'] }) => {
  return (
    <View style={styles.container}>
      {replay.map((item, index) => (
        <View key={`${item.stage}-${index}`} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.stage}>{stageLabel[item.stage]}</Text>
          <Text style={styles.day}>Ngày {item.day}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#58c9d2',
  },
  stage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  day: {
    fontSize: 12,
    color: '#6a7279',
  },
});
