import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WalletsScreen() {
  const expenseTotal = 100000;
  const incomeTotal = 0;
  const netChange = incomeTotal - expenseTotal;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.quickRow}>
          <View style={[styles.quickCard, styles.milestoneCard]}>
            <Text style={styles.quickCardText}>Những cột mốc</Text>
          </View>
          <View style={[styles.quickCard, styles.analysisCard]}>
            <Text style={styles.quickCardText}>Phân tích thêm</Text>
          </View>
        </View>

        <View style={styles.botWrap}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Chào bạn! 👋</Text>
          </View>
          <View style={styles.botCircle}>
            <Ionicons name="sparkles" size={34} color="#4c88ff" />
          </View>
        </View>

        <View style={styles.walletRow}>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#202020" />
              <Ionicons name="pencil" size={18} color="#777" />
            </View>
            <Text style={styles.walletName}>Ví chính</Text>
            <Text style={styles.walletAmount}>₫9,999,174,450,130</Text>
          </View>

          <View style={styles.newWalletCard}>
            <Ionicons name="add" size={38} color="#666" />
            <Text style={styles.newWalletText}>Ví mới</Text>
          </View>
        </View>

        <View style={styles.filterChipRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Tháng</Text>
            <Ionicons name="calendar-outline" size={18} color="#333" />
            <Ionicons name="chevron-down" size={18} color="#333" />
          </View>
        </View>

        <View style={styles.monthChip}>
          <Text style={styles.monthChipText}>tháng 4 năm 2026</Text>
          <Ionicons name="chevron-down" size={18} color="#666" />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Text style={styles.summaryTitle}>Thay đổi ròng</Text>
            <Ionicons name="information-circle-outline" size={22} color="#727272" />
          </View>
          <Text style={styles.netChangeText}>₫{netChange.toLocaleString('vi-VN')}</Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, styles.expense]}>Chi phí</Text>
              <Text style={[styles.statValue, styles.expense]}>₫{expenseTotal.toLocaleString('vi-VN')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, styles.income]}>Thu nhập</Text>
              <Text style={[styles.statValue, styles.income]}>₫{incomeTotal.toLocaleString('vi-VN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.segmentedRow}>
          <View style={[styles.segmentChip, styles.segmentChipActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Chi phí</Text>
          </View>
          <View style={styles.segmentChip}>
            <Text style={styles.segmentText}>Thu nhập</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner} />
          </View>

          <View style={styles.chartLegendRow}>
            <Text style={styles.legendName}>Thực phẩm</Text>
            <Text style={styles.legendAmount}>₫100,000</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>100%</Text>
            </View>
          </View>
        </View>

        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>Xu hướng chi tiêu</Text>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.trendNeedle} />
        </View>
      </ScrollView>

      <View style={styles.fab}>
        <Ionicons name="add" size={36} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  milestoneCard: {
    backgroundColor: '#f6c04b',
  },
  analysisCard: {
    backgroundColor: '#d8f2f5',
  },
  quickCardText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  botWrap: {
    alignItems: 'center',
    gap: 6,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  bubbleText: {
    fontSize: 16,
    color: '#333',
  },
  botCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  walletRow: {
    flexDirection: 'row',
    gap: 10,
  },
  walletCard: {
    flex: 1,
    backgroundColor: '#ecfbff',
    borderColor: '#b6f2f7',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 120,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletName: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1e1e',
  },
  walletAmount: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  newWalletCard: {
    flex: 1,
    backgroundColor: '#eceef3',
    borderRadius: 18,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newWalletText: {
    marginTop: 2,
    fontSize: 18,
    color: '#707070',
  },
  filterChipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadde3',
  },
  filterChipText: {
    fontSize: 16,
    color: '#1f1f1f',
    fontWeight: '700',
  },
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadde3',
  },
  monthChipText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 24,
    backgroundColor: '#d8f5f8',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#c8e9ed',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  netChangeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dde8e9',
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  expense: {
    color: '#ef7d83',
  },
  income: {
    color: '#5daea7',
  },
  segmentedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  segmentChip: {
    minWidth: 108,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e7e9ee',
    alignItems: 'center',
  },
  segmentChipActive: {
    backgroundColor: '#58c9d2',
  },
  segmentText: {
    fontSize: 18,
    color: '#444',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  chartCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9dde2',
    padding: 16,
    gap: 12,
  },
  donutOuter: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#8bc3ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  donutInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f2f2f',
  },
  legendAmount: {
    fontSize: 18,
    color: '#2f2f2f',
    textDecorationLine: 'underline',
  },
  progressTrack: {
    position: 'relative',
    height: 8,
    borderRadius: 99,
    backgroundColor: '#dbedf0',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#59c8d1',
  },
  progressBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: -12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3a7ca1',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b4b4b',
  },
  trendCard: {
    minHeight: 260,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9dde2',
    padding: 16,
    gap: 20,
    justifyContent: 'center',
  },
  trendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2c2c',
    textAlign: 'center',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#ecedf0',
  },
  trendNeedle: {
    position: 'absolute',
    left: 60,
    top: 84,
    width: 4,
    height: 140,
    backgroundColor: '#4e85f3',
    borderRadius: 3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2c6389',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
});
