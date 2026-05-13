import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GardenSeed } from '@/modules/garden/models/garden.types';

type SeedCardProps = {
  seed: GardenSeed;
  selected?: boolean;
  onPress?: () => void;
};

const rarityLabel: Record<GardenSeed['rarity'], string> = {
  common: 'Phổ biến',
  rare: 'Hiếm',
  epic: 'Kỳ ảo',
  legendary: 'Huyền thoại',
};

export const SeedCard = memo(({ seed, selected, onPress }: SeedCardProps) => {
  return (
    <Pressable style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      <View style={[styles.preview, { backgroundColor: seed.previewColors.petal }]}
      >
        <View style={[styles.previewDot, { backgroundColor: seed.previewColors.center }]} />
        <View style={[styles.previewLeaf, { backgroundColor: seed.previewColors.leaf }]} />
      </View>
      <Text style={styles.name}>{seed.name}</Text>
      <Text style={styles.rarity}>{rarityLabel[seed.rarity]}</Text>
      <Text style={styles.description}>{seed.description}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 240,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#58c9d2',
  },
  preview: {
    height: 120,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  previewLeaf: {
    position: 'absolute',
    width: 42,
    height: 16,
    borderRadius: 12,
    bottom: 20,
    right: 30,
    opacity: 0.7,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  rarity: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58c9d2',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  description: {
    fontSize: 13,
    color: '#6a7279',
    marginTop: 6,
    lineHeight: 18,
  },
});
