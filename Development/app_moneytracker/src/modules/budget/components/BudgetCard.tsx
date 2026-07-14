import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { formatVndAmount } from '@/shared/utils/money';

export interface BudgetCardProps {
  budgetId: string;
  categoryId: string; // Used to hash the accent color
  categoryName: string;
  categoryIcon: string | null;
  targetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percent: number;
  startDateStr: string;
  endDateStr: string;
  isIncome: boolean;
  onPress: () => void;
}

const ACCENT_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#eab308', // Yellow
];

const getAccentColor = (id: string) => {
  if (!id) return '#14b8c4';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
};

export const BudgetCard: React.FC<BudgetCardProps> = ({
  categoryId,
  categoryName,
  categoryIcon,
  targetAmount,
  spentAmount,
  remainingAmount,
  percent,
  startDateStr,
  endDateStr,
  isIncome,
  onPress,
}) => {
  const accentColor = getAccentColor(categoryId);

  let statusColor = '#10b981'; // Green (0-60%)
  if (percent > 60 && percent <= 85) {
    statusColor = '#f59e0b'; // Orange
  } else if (percent > 85) {
    statusColor = '#ef4444'; // Red
  }

  // Income budgets logic is inverted usually, but for UI simplicity we stick to the color ranges 
  // or adjust if it's an income budget.
  if (isIncome) {
    statusColor = percent >= 100 ? '#10b981' : (percent > 50 ? '#f59e0b' : '#ef4444');
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Background tint accent */}
      <View style={[styles.cardHeaderBackground, { backgroundColor: accentColor, opacity: 0.04 }]} />

      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}1A` }]}>
            <CategoryIcon icon={categoryIcon} size={24} color={accentColor} />
          </View>
          <Text style={[styles.categoryName, { color: accentColor }]}>{categoryName}</Text>
        </View>
      </View>

      {/* Spend info 2-columns */}
      <View style={styles.spendColumns}>
        <View style={styles.spendColumnLeft}>
          <Text style={styles.spendLabel}>Đã chi</Text>
          <Text style={styles.spendValuePrimary}>{formatVndAmount(spentAmount)}</Text>
        </View>
        <View style={styles.spendColumnRight}>
          <Text style={styles.spendLabel}>Ngân sách</Text>
          <Text style={styles.spendValueSecondary}>{formatVndAmount(targetAmount)}</Text>
        </View>
      </View>

      {/* Remaining */}
      <View style={styles.remainingRow}>
        <Text style={styles.remainingLabel}>Còn lại</Text>
        <Text style={[styles.remainingValue, { color: statusColor }]}>
          {isIncome && percent < 100
            ? `${formatVndAmount(remainingAmount)} để đạt`
            : percent > 100 && !isIncome
            ? `Vượt ${formatVndAmount(Math.abs(remainingAmount))}`
            : formatVndAmount(remainingAmount)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: statusColor }]}>{Math.round(percent)}%</Text>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {startDateStr} - {endDateStr}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  spendColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  spendColumnLeft: {
    flex: 1,
  },
  spendColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  spendLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  spendValuePrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  spendValueSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  remainingRow: {
    marginBottom: 12,
  },
  remainingLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  footerRow: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
