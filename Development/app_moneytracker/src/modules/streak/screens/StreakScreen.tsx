import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useStreakUsecases } from '@/modules/streak/usecases';
import { useBudgetUsecases } from '@/modules/budget/usecases';
import { AchievementType, StreakData } from '@/modules/streak/models/streak.types';

interface StreakScreenProps {
  visible: boolean;
  onClose: () => void;
}

type AchievementItem = {
  type: AchievementType;
  title: string;
  iconName: string;
  value?: (data: StreakData | undefined, highestLevel: number) => number | null;
};

const TOP_ACHIEVEMENTS: AchievementItem[] = [
  {
    type: 'LONGEST_STREAK',
    title: 'Chuỗi Dài Nhất',
    iconName: 'trending-up',
    value: (data) => data?.longestStreak ?? 0,
  },
  { type: 'PERFECT_WEEK', title: 'Tuần Hoàn Hảo', iconName: 'calendar' },
  { type: 'PERFECT_MONTH', title: 'Tháng Hoàn Hảo', iconName: 'calendar-number' },
];

const BOTTOM_ACHIEVEMENTS: AchievementItem[] = [
  {
    type: 'BUDGET_GUARDIAN',
    title: 'Người Bảo Vệ Ngân Sách',
    iconName: 'shield-checkmark',
    value: (_data, highestLevel) => (highestLevel > 0 ? highestLevel : null),
  },
  {
    type: 'TREASURE_KEEPER',
    title: 'Người Giữ Kho Báu',
    iconName: 'cash',
    value: (_data, highestLevel) => (highestLevel > 0 ? highestLevel : null),
  },
  {
    type: 'DEBT_CRUSHER',
    title: 'Kẻ Nghiền Nát Nợ',
    iconName: 'hammer',
    value: (_data, highestLevel) => (highestLevel > 0 ? highestLevel : null),
  },
];

export const StreakScreen: React.FC<StreakScreenProps> = ({ visible, onClose }) => {
  const { getStreak } = useStreakUsecases();
  const { getBudgets } = useBudgetUsecases();
  const fireAnim = useRef(new Animated.Value(1)).current;
  const fireRotate = useRef(new Animated.Value(0)).current;
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const { data: streakData, isLoading, refetch } = useQuery({
    queryKey: ['streak'],
    queryFn: getStreak,
    enabled: visible,
  });
  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
    enabled: visible,
  });

  const safeBudgetCount = useMemo(() => {
    const budgets = budgetsQuery.data ?? [];
    return budgets.filter((budget) => {
      if (typeof budget.remainingAmount === 'number') {
        return budget.remainingAmount >= 0;
      }
      const spent = budget.spentAmount ?? 0;
      return spent <= budget.amountLimit;
    }).length;
  }, [budgetsQuery.data]);

  useEffect(() => {
    if (visible) {
      refetch();
      const now = new Date();
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    }
  }, [visible, refetch]);
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1.08,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fireAnim, {
            toValue: 0.96,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(fireRotate, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fireRotate, {
            toValue: -1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [visible, fireAnim, fireRotate]);

  const calendarCells = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
      const inCurrentMonth = date.getMonth() === currentMonth;
      
      const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isActive = streakData?.activeDates?.includes(isoDate);
      const isToday = isoDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      return { date, inCurrentMonth, isActive, isToday };
    });
  }, [currentMonth, currentYear, streakData?.activeDates]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Những cột mốc</Text>
            <Text style={styles.subtitle}>Track your financial achievements</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#f5a623" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* STREAK HEADER */}
            <View style={styles.streakHeader}>
  {/* LEFT */}
  <View style={styles.streakLeft}>
    <Text style={styles.streakNumber}>
      {streakData?.currentStreak || 0}
    </Text>

    <Text style={styles.streakLabel}>
      ngày chuỗi
    </Text>
  </View>

  {/* FIRE */}
  <Animated.View
    style={[
      styles.fireWrapper,
      {
        transform: [
          { scale: fireAnim },
          {
            rotate: fireRotate.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-4deg', '4deg'],
            }),
          },
        ],
      },
    ]}
  >
    <Text style={styles.fireIcon}>🔥</Text>

    {/* glow */}
    <View style={styles.fireGlow} />
  </Animated.View>
</View>

            {/* COUNTDOWN */}
            <View style={styles.countdownBox}>
              <View style={styles.countdownRow}>
                <Ionicons name="timer-outline" size={20} color="#666" />
                <View style={styles.countdownTexts}>
                  <Text style={styles.countdownHint}>Chuỗi sẽ đặt lại sau</Text>
                  <Text style={styles.countdownValue}>{streakData?.resetHours || 40} Giờ</Text>
                </View>
              </View>
            </View>

            {/* CALENDAR */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeaderRow}>
                <Pressable onPress={handlePrevMonth} style={styles.calendarIconButton}>
                  <Ionicons name="caret-back" size={16} color="#333" />
                </Pressable>
                <Text style={styles.calendarMonthTitle}>
                  Tháng {currentMonth + 1} <Text style={{fontWeight: 'bold'}}>{currentYear}</Text>
                </Text>
                <Pressable onPress={handleNextMonth} style={styles.calendarIconButton}>
                  <Ionicons name="caret-forward" size={16} color="#333" />
                </Pressable>
                <Pressable onPress={handleResetToCurrentMonth} style={styles.calendarIconButton}>
                  <Ionicons name="refresh" size={18} color="#333" />
                </Pressable>
              </View>

              <View style={styles.calendarWeekdays}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                  <Text key={day} style={styles.calendarWeekdayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarCells.map((cell, index) => (
                  <View key={index} style={[
                    styles.calendarCell,
                    cell.isToday && styles.calendarCellToday
                  ]}>
                    <Text style={[
                      styles.calendarCellText,
                      !cell.inCurrentMonth && styles.calendarCellTextMuted
                    ]}>
                      {cell.date.getDate()}
                    </Text>
                    {cell.isActive && <Text style={styles.calendarCellEmoji}>😊</Text>}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* ACHIEVEMENTS */}
            <View style={styles.achievementSection}>
              <View style={styles.achievementHeaderRow}>
                <Text style={styles.achievementTitle}>🏆 Thành tựu</Text>
              </View>

              <View style={styles.achievementGrid}>
                {TOP_ACHIEVEMENTS.map((item) => {
                  const unlockedList = streakData?.achievements?.filter(a => a.type === item.type) || [];
                  const isUnlocked = item.type === 'LONGEST_STREAK' ? true : unlockedList.length > 0;
                  const highestLevel = isUnlocked ? Math.max(...unlockedList.map(a => a.level)) : 0;
                  const value = item.value?.(streakData, highestLevel);

                  return (
                    <View key={item.type} style={styles.achievementItem}>
                      <View style={[
                        styles.achievementCircle,
                        isUnlocked ? styles.achievementCircleUnlocked : styles.achievementCircleLocked
                      ]}>
                        <Ionicons
                          name={item.iconName as never}
                          size={32}
                          color={isUnlocked ? '#f5a623' : '#444'}
                        />
                        {typeof value === 'number' && (
                          <View style={styles.achievementBadge}>
                            <Text style={styles.achievementBadgeText}>{value}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.achievementName,
                        !isUnlocked && styles.achievementNameLocked
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.achievementGrid}>
                {BOTTOM_ACHIEVEMENTS.map((item) => {
                  const unlockedList = streakData?.achievements?.filter(a => a.type === item.type) || [];
                  const highestLevel = unlockedList.length > 0 ? Math.max(...unlockedList.map(a => a.level)) : 0;
                  const value = item.type === 'BUDGET_GUARDIAN'
                    ? safeBudgetCount
                    : item.value?.(streakData, highestLevel);
                  const isUnlocked = item.type === 'BUDGET_GUARDIAN' ? safeBudgetCount > 0 : unlockedList.length > 0;

                  return (
                    <View key={item.type} style={styles.achievementItem}>
                      <View style={[
                        styles.achievementCircle,
                        isUnlocked ? styles.achievementCircleUnlocked : styles.achievementCircleLocked
                      ]}>
                        <Ionicons
                          name={item.iconName as never}
                          size={32}
                          color={isUnlocked ? '#f5a623' : '#444'}
                        />
                        {typeof value === 'number' && (
                          <View style={styles.achievementBadge}>
                            <Text style={styles.achievementBadgeText}>{value}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.achievementName,
                        !isUnlocked && styles.achievementNameLocked
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#8b8b8b',
    marginTop: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '88%',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  streakLeft: {
    textAlign: 'center',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 80,
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 110,
    color: '#F5A623',
  },
  streakLabel: {
    marginTop: 4,
    fontSize: 25,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  fireWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fireIcon: {
    fontSize: 90,
  },
  fireGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(255,140,0,0.18)',
    transform: [{ scale: 1.2 }],
  },
  countdownBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 30,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countdownTexts: {
    flex: 1,
  },
  countdownHint: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  calendarCard: {
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 20,
  },
  calendarIconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: 16,
    color: '#666',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarWeekdayText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    color: '#8b8b8b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarCell: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: '#4bc5d1',
    borderRadius: 10,
  },
  calendarCellText: {
    fontSize: 14,
    color: '#333',
  },
  calendarCellTextMuted: {
    color: '#ddd',
  },
  calendarCellEmoji: {
    position: 'absolute',
    top: -4,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  achievementSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  achievementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    marginBottom: 8,
    position: 'relative',
  },
  achievementCircleUnlocked: {
    borderColor: '#f5a623',
    backgroundColor: '#fff9ef',
  },
  achievementCircleLocked: {
    borderColor: '#111',
    backgroundColor: '#111',
  },
  achievementBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#e6f7f8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4bc5d1',
  },
  achievementBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4bc5d1',
  },
  achievementName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  achievementNameLocked: {
    color: '#aaa',
  },
});
