import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { RewardCard } from '@/modules/garden/components/RewardCard';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { useGardenQueries } from '@/modules/garden/state';

export const GardenRewardsScreen = () => {
  const router = useRouter();
  const { currentQuery } = useGardenQueries();
  const rewards = currentQuery.data?.rewards ?? [];

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A2E35" />
        </Pressable>
        <Text style={styles.title}>Thưởng và thành tựu</Text>
        <Text style={styles.subtitle}>
          Mỗi phần thưởng là một lời nhắn nhẹ nhàng rằng bạn đang làm rất tốt.
        </Text>
        <View style={styles.rewardList}>
          {rewards.length > 0 ? (
            rewards.map((r) => <RewardCard key={r.rewardId} reward={r} />)
          ) : (
            <GlassCard opacity={0.6}>
              <Text style={styles.emptyTitle}>Chưa có phần thưởng mới</Text>
              <Text style={styles.emptyText}>
                Hãy hoàn thành vài nhiệm vụ nhỏ để mở khóa quà tặng đầu tiên.
              </Text>
            </GlassCard>
          )}
        </View>
        <GlassCard opacity={0.5}>
          <Text style={styles.noteTitle}>💡 Gợi nhớ nhẹ</Text>
          <Text style={styles.noteText}>
            Hãy quay lại mỗi ngày. Mỗi bước nhỏ sẽ giúp hoa nở đẹp hơn.
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F0E8' },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  backButton: {
    alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#2A2E35' },
  subtitle: { fontSize: 14, color: '#5A6068', lineHeight: 20 },
  rewardList: { gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#2A2E35' },
  emptyText: { fontSize: 13, color: '#5A6068', marginTop: 4 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: '#2A2E35' },
  noteText: { fontSize: 13, color: '#5A6068', marginTop: 4, lineHeight: 19 },
});
