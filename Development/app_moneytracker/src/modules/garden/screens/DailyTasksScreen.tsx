import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { GardenTaskCard } from '@/modules/garden/components/GardenTaskCard';
import { useGardenQueries } from '@/modules/garden/state';

export const DailyTasksScreen = () => {
  const router = useRouter();
  const { tasksQuery, completeTaskMutation, currentQuery } = useGardenQueries();

  const tasks = tasksQuery.data ?? [];
  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <View style={styles.screen}>
      <GardenBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>

        <Text style={styles.title}>Nhiệm vụ hôm nay</Text>
        <Text style={styles.subtitle}>
          Mỗi hoạt động nhỏ sẽ giúp vườn hoa của bạn mềm mại và bình yên hơn.
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Tiến trình hôm nay</Text>
          <Text style={styles.progressValue}>{completedCount}/{tasks.length} nhiệm vụ</Text>
        </View>

        <View style={styles.taskList}>
          {tasks.map((task) => (
            <GardenTaskCard
              key={task.taskId}
              task={task}
              onComplete={(taskId) => completeTaskMutation.mutate(taskId)}
            />
          ))}
        </View>

        <Pressable style={styles.rewardCard} onPress={() => router.push('/garden/rewards')}>
          <Text style={styles.rewardTitle}>Thưởng nhỏ của hôm nay</Text>
          <Text style={styles.rewardSubtitle}>Một chút niềm vui nhỏ sẽ theo bạn cả ngày.</Text>
          <View style={styles.rewardAction}>
            <Text style={styles.rewardActionText}>Xem phần thưởng</Text>
            <Ionicons name="chevron-forward" size={18} color="#1f1f1f" />
          </View>
        </Pressable>
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
    paddingBottom: 32,
    gap: 18,
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
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a939b',
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  taskList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  rewardSubtitle: {
    fontSize: 13,
    color: '#6a7279',
  },
  rewardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
});
