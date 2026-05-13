import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { FlowerRenderer } from '@/modules/garden/components/FlowerRenderer';
import { GardenTaskCard } from '@/modules/garden/components/GardenTaskCard';
import { ScoreMeter } from '@/modules/garden/components/ScoreMeter';
import { useGardenQueries } from '@/modules/garden/state';

export const GardenHomeScreen = () => {
  const router = useRouter();
  const { currentQuery, tasksQuery, flowerStateQuery } = useGardenQueries();

  const current = currentQuery.data;
  const tasks = tasksQuery.data ?? [];
  const flowerState = flowerStateQuery.data ?? current?.flower;

  const previewTasks = useMemo(() => tasks.slice(0, 2), [tasks]);

  return (
    <View style={styles.screen}>
      <GardenBackground weather={current?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Vườn tài chính</Text>
          <Text style={styles.subtitle}>Chăm sóc mỗi thói quen nhỏ mỗi ngày.</Text>
        </View>

        <View style={styles.flowerWrap}>
          {flowerState ? <FlowerRenderer flower={flowerState} size={250} /> : null}
          {current?.encouragement ? (
            <View style={styles.encouragement}>
              <Ionicons name="sparkles" size={16} color="#f0c773" />
              <Text style={styles.encouragementText}>{current.encouragement}</Text>
            </View>
          ) : null}
        </View>

        {current?.score ? <ScoreMeter score={current.score} /> : null}

        <View style={styles.quickRow}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/garden/selection')}>
            <Text style={styles.quickLabel}>Chọn hạt mới</Text>
            <Text style={styles.quickValue}>{current?.seed?.name ?? 'Chưa chọn'}</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/garden/archive')}>
            <Text style={styles.quickLabel}>Lịch sử</Text>
            <Text style={styles.quickValue}>Xem khu vườn</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhiệm vụ hôm nay</Text>
          <Pressable onPress={() => router.push('/garden/tasks')}>
            <Text style={styles.sectionAction}>Xem tất cả</Text>
          </Pressable>
        </View>
        <View style={styles.taskList}>
          {previewTasks.map((task) => (
            <GardenTaskCard key={task.taskId} task={task} showAction={false} />
          ))}
        </View>

        <Pressable style={styles.reportCard} onPress={() => router.push('/garden/report')}>
          <Text style={styles.reportTitle}>Báo cáo tháng này</Text>
          <Text style={styles.reportSubtitle}>
            Xem toàn bộ quá trình nở hoa và những khoảnh khắc đáng nhớ.
          </Text>
          <View style={styles.reportAction}>
            <Text style={styles.reportActionText}>Mở báo cáo</Text>
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
    gap: 18,
    paddingBottom: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7279',
  },
  flowerWrap: {
    alignItems: 'center',
    gap: 12,
  },
  encouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  encouragementText: {
    fontSize: 13,
    color: '#4c565d',
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a939b',
    textTransform: 'uppercase',
  },
  quickValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#58c9d2',
  },
  taskList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#6a7279',
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
});
