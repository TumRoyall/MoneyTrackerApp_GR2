import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { GardenReward } from '@/modules/garden/models/garden.types';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';

type RewardCardProps = {
  reward: GardenReward;
};

export const RewardCard = memo(({ reward }: RewardCardProps) => {
  return (
    <GlassCard style={styles.card} opacity={0.6}>
      <View style={styles.badgeWrap}>
        <Svg width={48} height={48} viewBox="0 0 48 48">
          <Defs>
            <RadialGradient id="rewardGlow" cx="0.5" cy="0.4" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor={reward.badgeColor} stopOpacity="0.7" />
              <Stop offset="0.6" stopColor={reward.badgeColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={reward.badgeColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="24" cy="24" r="24" fill="url(#rewardGlow)" />
          <Circle cx="24" cy="24" r="16" fill={reward.badgeColor} opacity={0.85} />
          <Circle cx="24" cy="24" r="10" fill="#FFFFFF" opacity={0.2} />
        </Svg>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{reward.title}</Text>
        <Text style={styles.description}>{reward.description}</Text>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    padding: 14,
  },
  badgeWrap: {
    width: 48,
    height: 48,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2E35',
  },
  description: {
    fontSize: 12,
    color: '#6A7279',
    lineHeight: 17,
  },
});
