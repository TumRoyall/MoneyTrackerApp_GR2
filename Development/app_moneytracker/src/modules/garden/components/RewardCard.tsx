import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GardenReward } from '@/modules/garden/models/garden.types';

type RewardCardProps = {
  reward: GardenReward;
};

export const RewardCard = memo(({ reward }: RewardCardProps) => {
  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: reward.badgeColor }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{reward.title}</Text>
        <Text style={styles.description}>{reward.description}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  description: {
    fontSize: 12,
    color: '#6a7279',
  },
});
