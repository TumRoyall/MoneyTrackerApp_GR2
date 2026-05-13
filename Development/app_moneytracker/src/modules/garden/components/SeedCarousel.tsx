import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GardenSeed } from '@/modules/garden/models/garden.types';
import { SeedCard } from '@/modules/garden/components/SeedCard';

type SeedCarouselProps = {
  seeds: GardenSeed[];
  selectedId?: string | null;
  onSelect?: (seedId: string) => void;
};

export const SeedCarousel = memo(({ seeds, selectedId, onSelect }: SeedCarouselProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={260}
      decelerationRate="fast"
      contentContainerStyle={styles.container}
    >
      {seeds.map((seed) => (
        <View key={seed.seedId} style={styles.cardWrap}>
          <SeedCard
            seed={seed}
            selected={seed.seedId === selectedId}
            onPress={() => onSelect?.(seed.seedId)}
          />
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cardWrap: {
    marginRight: 20,
  },
});
