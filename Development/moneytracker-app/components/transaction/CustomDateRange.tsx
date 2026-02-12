import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarModal } from "./CalendarModal";

interface Props {
  fromDate: Date | null;
  toDate: Date | null;
  onFromDateChange: (d: Date) => void;
  onToDateChange: (d: Date) => void;
}

export function CustomDateRange({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: Props) {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  return (
    <>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.input}>
            <Text style={styles.label}>Từ ngày</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setCalendarDate(fromDate || new Date());
                setShowFromPicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.text} />
              <Text style={styles.buttonText}>
                {fromDate
                  ? fromDate.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.input}>
            <Text style={styles.label}>Đến ngày</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setCalendarDate(toDate || new Date());
                setShowToPicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.text} />
              <Text style={styles.buttonText}>
                {toDate
                  ? toDate.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CalendarModal
        visible={showFromPicker}
        date={calendarDate}
        onChangeMonth={(delta) => {
          const nd = new Date(calendarDate);
          nd.setMonth(nd.getMonth() + delta);
          setCalendarDate(nd);
        }}
        onSelectDate={onFromDateChange}
        onClose={() => setShowFromPicker(false)}
        showToday={true}
      />

      <CalendarModal
        visible={showToPicker}
        date={calendarDate}
        onChangeMonth={(delta) => {
          const nd = new Date(calendarDate);
          nd.setMonth(nd.getMonth() + delta);
          setCalendarDate(nd);
        }}
        onSelectDate={onToDateChange}
        onClose={() => setShowToPicker(false)}
        showToday={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginVertical: 8 },
  row: { flexDirection: "row", gap: 12 },
  input: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonText: { fontSize: 14, color: colors.text, flex: 1 },
});
