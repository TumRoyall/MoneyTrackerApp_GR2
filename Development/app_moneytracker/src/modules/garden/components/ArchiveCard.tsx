import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GardenHistoryItem } from '@/modules/garden/models/garden.types';
import { FlowerRendererV2 } from '@/modules/garden/components/FlowerRendererV2';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

type ArchiveCardProps = {
  item: GardenHistoryItem;
};

export const ArchiveCard = memo(({ item }: ArchiveCardProps) => {
  const scoreColor =
    item.score.value >= 80 ? '#F0A0B8' :
    item.score.value >= 60 ? '#5ABCB4' :
    item.score.value >= 40 ? '#98C4A0' :
    '#B8A080';

  return (
    <GlassCard style={styles.card} opacity={0.6}>
      <Text style={styles.month}>{item.month}</Text>
      <Text style={styles.year}>{item.year}</Text>
      <View style={styles.flowerWrap}>
        <FlowerRendererV2 flower={item.flower} size={110} showAmbientGlow={false} />
      </View>
      <View style={[styles.badge, { backgroundColor: `${scoreColor}20` }]}>
        <Text style={[styles.badgeText, { color: scoreColor }]}>{item.score.value}/100</Text>
      </View>
      <Text style={styles.seedName}>{item.seed.name}</Text>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 4,
  },
  month: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2E35',
  },
  year: {
    fontSize: 12,
    color: '#6A7279',
  },
  flowerWrap: {
    marginVertical: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  seedName: {
    fontSize: 12,
    color: '#6A7279',
    marginTop: 4,
  },
});
