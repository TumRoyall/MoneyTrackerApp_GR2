import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { FlowerRendererV2 } from '@/modules/garden/components/FlowerRendererV2';
import { AmbientGlow } from '@/modules/garden/components/effects/AmbientGlow';
import { GardenTaskCard } from '@/modules/garden/components/GardenTaskCard';
import { ScoreMeter } from '@/modules/garden/components/ScoreMeter';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { qualityTokensV2 } from '@/modules/garden/assets/flowerTokens';
import { useGardenQueries } from '@/modules/garden/state';

export const GardenHomeScreen = () => {
  const router = useRouter();
  const { currentQuery, tasksQuery, flowerStateQuery } = useGardenQueries();

  const current = currentQuery.data;
  const tasks = tasksQuery.data ?? [];
  const flowerState = flowerStateQuery.data ?? current?.flower;

  const previewTasks = useMemo(() => tasks.slice(0, 2), [tasks]);

  const glowColor = flowerState
    ? qualityTokensV2[flowerState.quality].glow
    : 'rgba(255,220,160,0.2)';
  const glowIntensity = flowerState
    ? qualityTokensV2[flowerState.quality].vibrancy
    : 0.3;

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={current?.weather ?? 'sunny'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header — lighter, more ethereal */}
        <View style={styles.header}>
          <Text style={styles.title}>Vườn tài chính</Text>
          <Text style={styles.subtitle}>Chăm sóc mỗi thói quen nhỏ mỗi ngày.</Text>
        </View>

        {/* === FLOWER CENTERPIECE === */}
        <View style={styles.flowerSection}>
          {/* Ambient glow behind flower */}
          <View style={styles.glowContainer}>
            <AmbientGlow color={glowColor} intensity={glowIntensity} size={320} />
          </View>

          {/* Flower */}
          {flowerState ? (
            <FlowerRendererV2 flower={flowerState} size={290} />
          ) : null}

          {/* Encouragement bubble */}
          {current?.encouragement ? (
            <GlassCard style={styles.encouragement} opacity={0.7}>
              <View style={styles.encouragementInner}>
                <Ionicons name="sparkles" size={14} color="#E8B44C" />
                <Text style={styles.encouragementText}>{current.encouragement}</Text>
              </View>
            </GlassCard>
          ) : null}
        </View>

        {/* Score Meter */}
        {current?.score ? <ScoreMeter score={current.score} /> : null}

        {/* Quick Action Cards */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickCardWrap} onPress={() => router.push('/garden/selection')}>
            <GlassCard style={styles.quickCard} opacity={0.55}>
              <Text style={styles.quickIcon}>🌱</Text>
              <Text style={styles.quickLabel}>Chọn hạt mới</Text>
              <Text style={styles.quickValue}>{current?.seed?.name ?? 'Chưa chọn'}</Text>
            </GlassCard>
          </Pressable>
          <Pressable style={styles.quickCardWrap} onPress={() => router.push('/garden/archive')}>
            <GlassCard style={styles.quickCard} opacity={0.55}>
              <Text style={styles.quickIcon}>🏡</Text>
              <Text style={styles.quickLabel}>Lịch sử</Text>
              <Text style={styles.quickValue}>Xem khu vườn</Text>
            </GlassCard>
          </Pressable>
        </View>

        {/* Daily Tasks Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhiệm vụ hôm nay</Text>
          <Pressable onPress={() => router.push('/garden/tasks')}>
            <Text style={styles.sectionAction}>Xem tất cả →</Text>
          </Pressable>
        </View>
        <View style={styles.taskList}>
          {previewTasks.map((task) => (
            <GardenTaskCard key={task.taskId} task={task} showAction={false} />
          ))}
        </View>

        {/* Monthly Report Card */}
        <Pressable onPress={() => router.push('/garden/report')}>
          <GlassCard style={styles.reportCard} opacity={0.55} accentColor="#F0A0B8">
            <Text style={styles.reportTitle}>Báo cáo tháng này</Text>
            <Text style={styles.reportSubtitle}>
              Xem toàn bộ quá trình nở hoa và những khoảnh khắc đáng nhớ.
            </Text>
            <View style={styles.reportAction}>
              <Text style={styles.reportActionText}>Mở báo cáo</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
    paddingBottom: 36,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2E35',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6068',
    letterSpacing: 0.1,
  },

  /* Flower Section */
  flowerSection: {
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 320,
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encouragement: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  encouragementInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  encouragementText: {
    fontSize: 13,
    color: '#4A5058',
    fontWeight: '600',
  },

  /* Quick Cards */
  quickRow: {
    flexDirection: 'row',
    gap: 14,
  },
  quickCardWrap: {
    flex: 1,
  },
  quickCard: {
    gap: 6,
    padding: 14,
  },
  quickIcon: {
    fontSize: 20,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6A7279',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2E35',
  },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E35',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5ABCB4',
  },
  taskList: {
    gap: 10,
  },

  /* Report */
  reportCard: {
    gap: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E35',
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#5A6068',
    lineHeight: 19,
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reportActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2E35',
  },
});
