import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParallaxBackground } from '@/modules/garden/components/background/ParallaxBackground';
import { FlowerRendererV2 } from '@/modules/garden/components/FlowerRendererV2';
import { AmbientGlow } from '@/modules/garden/components/effects/AmbientGlow';
import { GrowthTimeline } from '@/modules/garden/components/GrowthTimeline';
import { ReportStatCard } from '@/modules/garden/components/ReportStatCard';
import { GlassCard } from '@/modules/garden/components/ui/GlassCard';
import { useGardenQueries } from '@/modules/garden/state';

export const MonthlyReportScreen = () => {
  const router = useRouter();
  const { reportQuery, currentQuery } = useGardenQueries();
  const report = reportQuery.data;

  if (!report) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
      </View>
    );
  }

  const finalFlower = report.replay.length > 0
    ? {
        stage: report.replay[report.replay.length - 1].stage,
        quality: report.replay[report.replay.length - 1].quality,
        progress: 1,
      }
    : null;

  return (
    <View style={styles.screen}>
      <ParallaxBackground weather={currentQuery.data?.weather ?? 'sunny'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#2A2E35" />
        </Pressable>

        <Text style={styles.title}>Báo cáo {report.month}</Text>
        <Text style={styles.subtitle}>
          Một tháng chăm sóc vườn hoa, bạn đã làm được rất nhiều.
        </Text>

        {/* Flower Showcase with Glow */}
        {finalFlower && (
          <View style={styles.flowerShowcase}>
            <AmbientGlow color="rgba(240,160,184,0.3)" intensity={0.7} size={280} />
            <FlowerRendererV2
              flower={{ stage: finalFlower.stage, quality: finalFlower.quality, progress: 1 }}
              size={260}
            />
          </View>
        )}

        {/* Stats Row 1 */}
        <View style={styles.statsRow}>
          <ReportStatCard
            label="Điểm chăm sóc"
            value={`${report.finalScore.value}/100`}
            hint="Tâm ổn định và mềm mại"
            accentColor="#5ABCB4"
          />
          <ReportStatCard
            label="Tỉ lệ tiết kiệm"
            value={`${Math.round(report.savingsRate * 100)}%`}
            hint="Bạn đã giữ được cảm giác yên tâm"
            accentColor="#F0A0B8"
          />
        </View>

        {/* Stats Row 2 */}
        <View style={styles.statsRow}>
          <ReportStatCard
            label="Biến động chi tiêu"
            value={`${Math.round(report.spendingChange * 100)}%`}
            hint="Nhẹ nhàng hơn tháng trước"
            accentColor="#98C4A0"
          />
          <ReportStatCard
            label="Hạt giống"
            value={report.seed.name}
            hint="Hoa của riêng bạn"
            accentColor="#E8B44C"
          />
        </View>

        {/* Achievements */}
        <GlassCard opacity={0.55} accentColor="#F0A0B8">
          <Text style={styles.sectionTitle}>✨ Thành tựu đáng nhớ</Text>
          <View style={styles.achievementList}>
            {report.achievements.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.achievementRow}>
                <View style={styles.achievementDot} />
                <Text style={styles.achievementItem}>{item}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Growth Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>🌱 Hành trình nở hoa</Text>
          <GrowthTimeline replay={report.replay} />
        </View>

        {/* CTA */}
        <Pressable style={styles.primaryButton} onPress={() => router.push('/garden/rewards')}>
          <Text style={styles.primaryButtonText}>🎁 Xem thưởng</Text>
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0E8',
  },
  loadingText: {
    fontSize: 14,
    color: '#5A6068',
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
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
  flowerShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 280,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E35',
    marginBottom: 8,
  },
  achievementList: {
    gap: 6,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0A0B8',
  },
  achievementItem: {
    fontSize: 14,
    color: '#4A5058',
    flex: 1,
    lineHeight: 20,
  },
  timelineSection: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(90, 188, 180, 0.85)',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#5ABCB4',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
