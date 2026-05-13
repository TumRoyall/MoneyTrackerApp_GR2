import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { RewardCard } from '@/modules/garden/components/RewardCard';
import { useGardenQueries } from '@/modules/garden/state';

export const GardenRewardsScreen = () => {
  const router = useRouter();
  const { currentQuery } = useGardenQueries();
  const rewards = currentQuery.data?.rewards ?? [];

  return (
    <View style={styles.screen}>
      <GardenBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>

        <Text style={styles.title}>Thưởng và thành tựu</Text>
        <Text style={styles.subtitle}>
          Mỗi phần thưởng là một lời nhắn nhẹ nhàng rằng bạn đang làm rất tốt.
        </Text>

        <View style={styles.rewardList}>
          {rewards.length > 0 ? (
            rewards.map((reward) => <RewardCard key={reward.rewardId} reward={reward} />)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có phần thưởng mới</Text>
              <Text style={styles.emptyText}>
                Hãy hoàn thành vài nhiệm vụ nhỏ để mở khóa quà tặng đầu tiên.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Gợi nhớ nhẹ</Text>
          <Text style={styles.noteText}>
            Hãy quay lại mỗi ngày. Mỗi bước nhỏ sẽ giúp hoa nở đẹp hơn.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f5f2',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7279',
  },
  rewardList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  emptyText: {
    fontSize: 13,
    color: '#6a7279',
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  noteText: {
    fontSize: 13,
    color: '#6a7279',
  },
});
