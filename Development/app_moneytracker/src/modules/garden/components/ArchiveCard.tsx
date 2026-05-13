import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GardenHistoryItem } from '@/modules/garden/models/garden.types';
import { FlowerRenderer } from '@/modules/garden/components/FlowerRenderer';

type ArchiveCardProps = {
  item: GardenHistoryItem;
};

export const ArchiveCard = memo(({ item }: ArchiveCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.month}>{item.month}</Text>
      <Text style={styles.year}>{item.year}</Text>
      <FlowerRenderer flower={item.flower} size={120} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.score.value}/100</Text>
      </View>
      <Text style={styles.seedName}>{item.seed.name}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  month: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  year: {
    fontSize: 12,
    color: '#6a7279',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#eef7f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58c9d2',
  },
  seedName: {
    fontSize: 12,
    color: '#6a7279',
    marginTop: 6,
  },
});
