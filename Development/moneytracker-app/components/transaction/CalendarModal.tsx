import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  date: Date;
  onChangeMonth?: (delta: number) => void;
  onSelectDate: (d: Date) => void;
  onClose: () => void;
  showToday?: boolean;
}

export function CalendarModal({
  visible,
  date,
  onChangeMonth,
  onSelectDate,
  onClose,
  showToday = true,
}: Props) {
  const calendarDays = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [date]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => onChangeMonth?.(-1)}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
              Tháng {date.getMonth() + 1}, {date.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => onChangeMonth?.(1)}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdays}>
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
              <View key={d} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              const isToday =
                day !== null &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear() &&
                day === new Date().getDate();

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.day, isToday && styles.dayToday]}
                  disabled={day === null}
                  onPress={() => {
                    if (day === null) return;
                    const selected = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      day,
                    );
                    onSelectDate(selected);
                    onClose();
                  }}
                >
                  {day !== null && (
                    <Text
                      style={[styles.dayText, isToday && styles.dayTextToday]}
                    >
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {showToday && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={() => {
                  onSelectDate(new Date());
                  onClose();
                }}
              >
                <Ionicons
                  name="today-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.todayText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdrop: { flex: 1 },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  dragHandle: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CCC",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text },
  weekdays: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekdayCell: { flex: 1, alignItems: "center" },
  weekdayText: { fontSize: 12, fontWeight: "600", color: "#999" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16 },
  day: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  dayToday: { backgroundColor: "#E8F5E9", borderRadius: 8 },
  dayText: { fontSize: 16, color: colors.text },
  dayTextToday: { color: colors.primary, fontWeight: "600" },
  actions: { paddingHorizontal: 16, paddingTop: 16 },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
  },
  todayText: { fontSize: 16, fontWeight: "600", color: colors.primary },
});
