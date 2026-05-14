import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { GardenTaskCard } from '@/modules/garden/components/GardenTaskCard';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { useGardenQueries } from '@/modules/garden/state';

export const DailyTasksScreen = () => {
  const router = useRouter();
  const { tasksQuery, completeTaskMutation, currentQuery } = useGardenQueries();

  const tasks = tasksQuery.data ?? [];
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={currentQuery.data?.weather ?? 'sunny'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A2E35" />
        </Pressable>

        <Text style={styles.title}>Nhiệm vụ hôm nay</Text>
        <Text style={styles.subtitle}>
          Mỗi hoạt động nhỏ sẽ giúp vườn hoa của bạn mềm mại và bình yên hơn.
        </Text>

        {/* Progress Card */}
        <GlassCard opacity={0.6} accentColor="#5ABCB4">
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Tiến trình hôm nay</Text>
              <Text style={styles.progressValue}>
                {completedCount}/{totalCount} nhiệm vụ
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
          </View>
        </GlassCard>

        {/* Task List */}
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <GardenTaskCard
              key={task.taskId}
              task={task}
              onComplete={(taskId) => completeTaskMutation.mutate(taskId)}
            />
          ))}
        </View>

        {/* Reward Teaser */}
        <Pressable onPress={() => router.push('/garden/rewards')}>
          <GlassCard opacity={0.55} accentColor="#F0A0B8">
            <Text style={styles.rewardTitle}>🎁 Thưởng nhỏ của hôm nay</Text>
            <Text style={styles.rewardSubtitle}>
              Một chút niềm vui nhỏ sẽ theo bạn cả ngày.
            </Text>
            <View style={styles.rewardAction}>
              <Text style={styles.rewardActionText}>Xem phần thưởng</Text>
              <Ionicons name="chevron-forward" size={16} color="#2A2E35" />
            </View>
          </GlassCard>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E8F0E8',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2E35',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6068',
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressInfo: {
    gap: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6A7279',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2E35',
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(90, 188, 180, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5ABCB4',
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(200, 210, 220, 0.3)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#5ABCB4',
    opacity: 0.75,
  },
  taskList: {
    gap: 10,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E35',
  },
  rewardSubtitle: {
    fontSize: 13,
    color: '#5A6068',
    marginTop: 4,
    lineHeight: 19,
  },
  rewardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  rewardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2E35',
  },
});
