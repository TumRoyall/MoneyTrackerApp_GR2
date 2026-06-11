import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from './theme';

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
}

const isSameDate = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const buildCalendarMatrix = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

  // Previous month padding
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6; // Monday is 0, Sunday is 6

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      inCurrentMonth: false,
    });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    cells.push({
      date: new Date(year, month, i),
      inCurrentMonth: true,
    });
  }

  // Next month padding
  const remaining = 42 - cells.length; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      date: new Date(year, month + 1, i),
      inCurrentMonth: false,
    });
  }

  return cells;
};

export const DatePickerModal = ({ visible, value, onConfirm, onCancel, title = 'Chọn ngày' }: DatePickerModalProps) => {
  const [calendarMonth, setCalendarMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(value);

  const calendarCells = useMemo(() => buildCalendarMatrix(calendarMonth), [calendarMonth]);

  const handleConfirm = () => {
    onConfirm(calendarSelectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.calendarHeaderRow}>
            <Pressable
              style={styles.navBtn}
              onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              <Ionicons name="chevron-back" size={20} color="#1f1f1f" />
            </Pressable>
            <Text style={styles.calendarMonthTitle}>
              {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              style={styles.navBtn}
              onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color="#1f1f1f" />
            </Pressable>
          </View>

          <View style={styles.calendarWeekdays}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <Text key={day} style={styles.calendarWeekdayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, index) => {
              const selected = isSameDate(cell.date, calendarSelectedDate);
              const isToday = isSameDate(cell.date, new Date());
              return (
                <Pressable
                  key={index}
                  onPress={() => setCalendarSelectedDate(cell.date)}
                  style={[
                    styles.calendarCell, 
                    !selected && isToday ? styles.calendarCellToday : null,
                    selected ? styles.calendarCellSelected : null
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarCellText,
                      !cell.inCurrentMonth ? styles.calendarCellTextMuted : null,
                      !selected && isToday ? styles.calendarCellTextToday : null,
                      selected ? styles.calendarCellTextSelected : null,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Button title="OK" onPress={handleConfirm} style={styles.confirmBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    padding: spacing.sm,
  },
  calendarMonthTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  calendarWeekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  calendarCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarCellText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  calendarCellTextMuted: {
    color: colors.textTertiary,
  },
  calendarCellTextSelected: {
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  calendarCellToday: {
    backgroundColor: '#e7f7f9',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  calendarCellTextToday: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  confirmBtn: {
    minWidth: 80,
  },
});
