import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '@/modules/transaction/models/transaction.types';
import { Category } from '@/modules/category/models/category.types';
import { formatVndAmount } from '@/shared/utils/money';

interface AnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  onExportReport: () => void;
}

type AnalysisOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
};

type AnalysisView = 'menu' | 'category' | 'top' | 'trend' | 'comparison';

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: 'category',
    title: 'Chi tiêu theo danh mục',
    description: 'Xem chi tiêu chi tiết theo từng danh mục',
    icon: 'chart-pie',
    iconColor: '#e74c3c',
  },
  {
    id: 'top',
    title: 'Top giao dịch lớn',
    description: 'Những giao dịch có số tiền cao nhất',
    icon: 'trending-up',
    iconColor: '#9b59b6',
  },
  {
    id: 'trend',
    title: 'Xu hướng thu chi',
    description: 'Phân tích xu hướng thu nhập và chi tiêu',
    icon: 'chart-line',
    iconColor: '#3498db',
  },
  {
    id: 'comparison',
    title: 'So sánh tháng',
    description: 'So sánh thu chi giữa các tháng',
    icon: 'compare',
    iconColor: '#27ae60',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  visible,
  onClose,
  transactions,
  categories,
  onExportReport,
}) => {
  const [currentView, setCurrentView] = useState<AnalysisView>('menu');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.categoryId, c])),
    [categories]
  );

  // Analysis data computations
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      const category = categoryMap.get(tx.categoryId);
      if (category?.type?.toUpperCase() === 'EXPENSE' || tx.type === 'EXPENSE') {
        const current = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, current + tx.amount);
      }
    });
    return Array.from(map.entries())
      .map(([categoryId, total]) => ({
        category: categoryMap.get(categoryId),
        total,
      }))
      .filter((item) => item.category)
      .sort((a, b) => b.total - a.total);
  }, [transactions, categoryMap]);

  const topExpenses = useMemo(() => {
    return transactions
      .filter((tx) => categoryMap.get(tx.categoryId)?.type?.toUpperCase() === 'EXPENSE' || tx.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, categoryMap]);

  const topIncomes = useMemo(() => {
    return transactions
      .filter((tx) => categoryMap.get(tx.categoryId)?.type?.toUpperCase() === 'INCOME' || tx.type === 'INCOME')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, categoryMap]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    transactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      const current = map.get(month) || { income: 0, expense: 0 };
      const isIncome = categoryMap.get(tx.categoryId)?.type?.toUpperCase() === 'INCOME' || tx.type === 'INCOME';
      if (isIncome) {
        current.income += tx.amount;
      } else {
        current.expense += tx.amount;
      }
      map.set(month, current);
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data, net: data.income - data.expense }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions, categoryMap]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            categoryMap.get(tx.categoryId)?.type?.toUpperCase() === 'INCOME' || tx.type === 'INCOME'
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, categoryMap]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            categoryMap.get(tx.categoryId)?.type?.toUpperCase() === 'EXPENSE' || tx.type === 'EXPENSE'
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, categoryMap]
  );

  const handleBack = () => {
    setCurrentView('menu');
  };

  const renderMenu = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Phân tích thêm</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tổng thu</Text>
          <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
            {formatVndAmount(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tổng chi</Text>
          <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>
            {formatVndAmount(totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Chênh lệch</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: totalIncome - totalExpense >= 0 ? '#27ae60' : '#e74c3c' },
            ]}
          >
            {formatVndAmount(Math.abs(totalIncome - totalExpense))}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {ANALYSIS_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={styles.optionCard}
            onPress={() => setCurrentView(option.id as AnalysisView)}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.iconColor + '20' }]}>
              <MaterialCommunityIcons name={option.icon} size={28} color={option.iconColor} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>
        ))}

        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Xuất báo cáo</Text>
          <Pressable style={styles.exportButton} onPress={onExportReport}>
            <MaterialCommunityIcons name="file-export" size={24} color="#fff" />
            <Text style={styles.exportButtonText}>Xuất CSV theo tháng</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );

  const renderCategoryAnalysis = () => (
    <>
      <View style={styles.modalHeader}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center', marginRight: 40 }]}>
          Chi tiêu theo danh mục
        </Text>
      </View>

      <ScrollView style={styles.analysisContent} showsVerticalScrollIndicator={false}>
        {expenseByCategory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-pie" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có dữ liệu chi tiêu</Text>
          </View>
        ) : (
          expenseByCategory.map((item, index) => {
            const percentage = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
            return (
              <View key={item.category?.categoryId || index} style={styles.categoryRow}>
                <View style={styles.categoryRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: (item.category?.color || '#29bcc8') + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(item.category?.icon as any) || 'help'}
                    size={20}
                    color={item.category?.color || '#29bcc8'}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category?.name || 'Danh mục'}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: item.category?.color || '#29bcc8',
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.amountText}>{formatVndAmount(item.total)}</Text>
                  <Text style={styles.percentText}>{percentage.toFixed(1)}%</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );

  const renderTopTransactions = () => (
    <>
      <View style={styles.modalHeader}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center', marginRight: 40 }]}>
          Top giao dịch lớn
        </Text>
      </View>

      <ScrollView style={styles.analysisContent} showsVerticalScrollIndicator={false}>
        {topExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trending-up" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có giao dịch chi</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionSubtitle}>💸 Top chi tiêu lớn</Text>
            {topExpenses.map((tx, index) => {
              const category = categoryMap.get(tx.categoryId);
              return (
                <View key={tx.transactionId} style={styles.topTxRow}>
                  <View style={styles.topTxRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topTxInfo}>
                    <Text style={styles.topTxCategory}>{category?.name || 'Danh mục'}</Text>
                    <Text style={styles.topTxNote} numberOfLines={1}>
                      {tx.note || tx.date}
                    </Text>
                  </View>
                  <Text style={styles.topTxAmount}>-{formatVndAmount(tx.amount)}</Text>
                </View>
              );
            })}

            {topIncomes.length > 0 && (
              <>
                <Text style={[styles.sectionSubtitle, { marginTop: 24 }]}>💰 Top thu nhập lớn</Text>
                {topIncomes.map((tx, index) => {
                  const category = categoryMap.get(tx.categoryId);
                  return (
                    <View key={tx.transactionId} style={styles.topTxRow}>
                      <View style={[styles.topTxRank, { backgroundColor: '#27ae6020' }]}>
                        <Text style={[styles.rankText, { color: '#27ae60' }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.topTxInfo}>
                        <Text style={styles.topTxCategory}>{category?.name || 'Danh mục'}</Text>
                        <Text style={styles.topTxNote} numberOfLines={1}>
                          {tx.note || tx.date}
                        </Text>
                      </View>
                      <Text style={[styles.topTxAmount, { color: '#27ae60' }]}>
                        +{formatVndAmount(tx.amount)}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </>
  );

  const renderTrendAnalysis = () => (
    <>
      <View style={styles.modalHeader}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center', marginRight: 40 }]}>
          Xu hướng thu chi
        </Text>
      </View>

      <ScrollView style={styles.analysisContent} showsVerticalScrollIndicator={false}>
        {monthlyTrend.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có dữ liệu</Text>
          </View>
        ) : (
          <>
            {/* Simple bar chart representation */}
            <View style={styles.chartContainer}>
              {monthlyTrend.slice(-6).map((item) => {
                const maxValue = Math.max(
                  ...monthlyTrend.map((m) => Math.max(m.income, m.expense))
                );
                const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 100 : 0;
                const expenseHeight = maxValue > 0 ? (item.expense / maxValue) * 100 : 0;

                return (
                  <View key={item.month} style={styles.chartBar}>
                    <View style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          styles.incomeBar,
                          { height: `${incomeHeight}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          styles.expenseBar,
                          { height: `${expenseHeight}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.month.slice(5)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
                <Text style={styles.legendText}>Thu nhập</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                <Text style={styles.legendText}>Chi tiêu</Text>
              </View>
            </View>

            {/* Monthly breakdown */}
            {monthlyTrend.slice(-6).reverse().map((item) => {
              const monthName = new Date(item.month + '-01').toLocaleDateString('vi-VN', {
                month: 'short',
                year: 'numeric',
              });
              return (
                <View key={item.month} style={styles.trendRow}>
                  <Text style={styles.trendMonth}>{monthName}</Text>
                  <View style={styles.trendValues}>
                    <Text style={styles.trendIncome}>▲ {formatVndAmount(item.income)}</Text>
                    <Text style={styles.trendExpense}>▼ {formatVndAmount(item.expense)}</Text>
                    <Text
                      style={[
                        styles.trendNet,
                        { color: item.net >= 0 ? '#27ae60' : '#e74c3c' },
                      ]}
                    >
                      = {formatVndAmount(Math.abs(item.net))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );

  const renderComparison = () => {
    const currentMonth = monthlyTrend[monthlyTrend.length - 1];
    const prevMonth = monthlyTrend[monthlyTrend.length - 2];

    const incomeChange = prevMonth
      ? ((currentMonth?.income - prevMonth.income) / prevMonth.income) * 100
      : 0;
    const expenseChange = prevMonth
      ? ((currentMonth?.expense - prevMonth.expense) / prevMonth.expense) * 100
      : 0;

    return (
      <>
        <View style={styles.modalHeader}>
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center', marginRight: 40 }]}>
            So sánh tháng
          </Text>
        </View>

        <ScrollView style={styles.analysisContent} showsVerticalScrollIndicator={false}>
          {monthlyTrend.length < 2 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="compare" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Cần ít nhất 2 tháng dữ liệu để so sánh</Text>
            </View>
          ) : (
            <>
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>So sánh tháng gần nhất</Text>

                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonMonth}>
                    <Text style={styles.comparisonMonthLabel}>
                      {new Date(prevMonth.month + '-01').toLocaleDateString('vi-VN', {
                        month: 'long',
                      })}
                    </Text>
                    <Text style={styles.comparisonMonthValue}>
                      {formatVndAmount(prevMonth.income)}
                    </Text>
                    <Text style={styles.comparisonMonthLabel}>Thu nhập</Text>
                  </View>

                  <View style={styles.comparisonVs}>
                    <Text style={styles.vsText}>vs</Text>
                  </View>

                  <View style={styles.comparisonMonth}>
                    <Text style={styles.comparisonMonthLabel}>
                      {new Date(currentMonth.month + '-01').toLocaleDateString('vi-VN', {
                        month: 'long',
                      })}
                    </Text>
                    <Text style={styles.comparisonMonthValue}>
                      {formatVndAmount(currentMonth.income)}
                    </Text>
                    <Text style={styles.comparisonMonthLabel}>Thu nhập</Text>
                  </View>
                </View>

                <View style={styles.changeIndicator}>
                  <MaterialCommunityIcons
                    name={incomeChange >= 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={20}
                    color={incomeChange >= 0 ? '#27ae60' : '#e74c3c'}
                  />
                  <Text
                    style={[
                      styles.changeText,
                      { color: incomeChange >= 0 ? '#27ae60' : '#e74c3c' },
                    ]}
                  >
                    {Math.abs(incomeChange).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.comparisonDivider} />

                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonMonth}>
                    <Text style={styles.comparisonMonthLabel}>
                      {new Date(prevMonth.month + '-01').toLocaleDateString('vi-VN', {
                        month: 'long',
                      })}
                    </Text>
                    <Text style={[styles.comparisonMonthValue, { color: '#e74c3c' }]}>
                      {formatVndAmount(prevMonth.expense)}
                    </Text>
                    <Text style={styles.comparisonMonthLabel}>Chi tiêu</Text>
                  </View>

                  <View style={styles.comparisonVs}>
                    <Text style={styles.vsText}>vs</Text>
                  </View>

                  <View style={styles.comparisonMonth}>
                    <Text style={styles.comparisonMonthLabel}>
                      {new Date(currentMonth.month + '-01').toLocaleDateString('vi-VN', {
                        month: 'long',
                      })}
                    </Text>
                    <Text style={[styles.comparisonMonthValue, { color: '#e74c3c' }]}>
                      {formatVndAmount(currentMonth.expense)}
                    </Text>
                    <Text style={styles.comparisonMonthLabel}>Chi tiêu</Text>
                  </View>
                </View>

                <View style={styles.changeIndicator}>
                  <MaterialCommunityIcons
                    name={expenseChange <= 0 ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={20}
                    color={expenseChange <= 0 ? '#27ae60' : '#e74c3c'}
                  />
                  <Text
                    style={[
                      styles.changeText,
                      { color: expenseChange <= 0 ? '#27ae60' : '#e74c3c' },
                    ]}
                  >
                    {Math.abs(expenseChange).toFixed(1)}%
                  </Text>
                  <Text style={styles.changeHint}>
                    {expenseChange <= 0 ? '(Tốt hơn)' : '(Cần cải thiện)'}
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>💡 Nhận xét</Text>
                {incomeChange >= 0 && expenseChange <= 0 ? (
                  <Text style={styles.insightText}>
                    Tuyệt vời! Thu nhập tăng và chi tiêu giảm. Tài chính của bạn đang cải
                    thiện tốt!
                  </Text>
                ) : incomeChange < 0 && expenseChange > 0 ? (
                  <Text style={styles.insightText}>
                    ⚠️ Cảnh báo: Thu nhập giảm và chi tiêu tăng. Hãy cân nhắc cắt giảm chi tiêu
                    không cần thiết.
                  </Text>
                ) : incomeChange >= 0 && expenseChange > 0 ? (
                  <Text style={styles.insightText}>
                    Thu nhập tăng nhưng chi tiêu cũng tăng. Hãy chú ý kiểm soát chi tiêu.
                  </Text>
                ) : (
                  <Text style={styles.insightText}>
                    Thu nhập giảm nhưng chi tiêu được kiểm soát tốt. Hãy tìm cách tăng thu nhập.
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {currentView === 'menu' && renderMenu()}
          {currentView === 'category' && renderCategoryAnalysis()}
          {currentView === 'top' && renderTopTransactions()}
          {currentView === 'trend' && renderTrendAnalysis()}
          {currentView === 'comparison' && renderComparison()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f1f1f',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionsList: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  exportSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#29bcc8',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  analysisContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  // Category analysis styles
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  categoryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8eaed',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e74c3c',
  },
  percentText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Top transactions styles
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12,
  },
  topTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  topTxRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fdecea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topTxInfo: {
    flex: 1,
  },
  topTxCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  topTxNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  topTxAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e74c3c',
  },
  // Trend analysis styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: '#27ae60',
  },
  expenseBar: {
    backgroundColor: '#e74c3c',
  },
  barLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  trendRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 8,
  },
  trendValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendIncome: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  trendExpense: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  trendNet: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Comparison styles
  comparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonMonth: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonMonthLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonMonthValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27ae60',
    marginVertical: 4,
  },
  comparisonVs: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  changeHint: {
    fontSize: 12,
    color: '#999',
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 16,
  },
  insightCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});
