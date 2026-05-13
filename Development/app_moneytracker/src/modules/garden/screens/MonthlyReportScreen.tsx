import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GardenBackground } from '@/modules/garden/components/GardenBackground';
import { FlowerRenderer } from '@/modules/garden/components/FlowerRenderer';
import { GrowthTimeline } from '@/modules/garden/components/GrowthTimeline';
import { ReportStatCard } from '@/modules/garden/components/ReportStatCard';
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

  return (
    <View style={styles.screen}>
      <GardenBackground weather={currentQuery.data?.weather ?? 'sunny'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>

        <Text style={styles.title}>Báo cáo {report.month}</Text>
        <Text style={styles.subtitle}>
          Một tháng chăm sóc vườn hoa, bạn đã làm được rất nhiều.
        </Text>

        <View style={styles.flowerWrap}>
          {report.replay.length > 0 ? (
            <FlowerRenderer
              flower={{
                stage: report.replay[report.replay.length - 1].stage,
                quality: report.replay[report.replay.length - 1].quality,
                progress: 1,
              }}
              size={240}
            />
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <ReportStatCard
            label="Điểm chăm sóc"
            value={`${report.finalScore.value}/100`}
            hint="Tâm ổn định và mềm mại"
          />
          <ReportStatCard
            label="Tỉ lệ tiết kiệm"
            value={`${Math.round(report.savingsRate * 100)}%`}
            hint="Bạn đã giữ được cảm giác yên tâm"
          />
        </View>

        <View style={styles.statsRow}>
          <ReportStatCard
            label="Biến động chi tiêu"
            value={`${Math.round(report.spendingChange * 100)}%`}
            hint="Nhẹ nhàng hơn tháng trước"
          />
          <ReportStatCard
            label="Hạt giống"
            value={report.seed.name}
            hint="Hoa của riêng bạn"
          />
        </View>

        <View style={styles.achievementCard}>
          <Text style={styles.sectionTitle}>Thành tựu đáng nhớ</Text>
          {report.achievements.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.achievementItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Hành trình nở hoa</Text>
          <GrowthTimeline replay={report.replay} />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/garden/rewards')}>
          <Text style={styles.primaryButtonText}>Xem thưởng</Text>
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f5f2',
  },
  loadingText: {
    fontSize: 14,
    color: '#6a7279',
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
  flowerWrap: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
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
  achievementItem: {
    fontSize: 13,
    color: '#4c565d',
  },
  timelineSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  primaryButton: {
    backgroundColor: '#58c9d2',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
