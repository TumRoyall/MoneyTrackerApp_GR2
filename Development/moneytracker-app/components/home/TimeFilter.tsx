import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function TimeFilter() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const currentYear = selectedMonth.getFullYear();
  const currentMonth = selectedMonth.getMonth(); // 0-11

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    setSelectedMonth(newDate);
    setShowMonthPicker(false);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(currentYear, currentMonth + 1, 1));
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Thời gian</Text>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.value}>
            {months[currentMonth]} năm {currentYear}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Quick filter buttons */}
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setSelectedMonth(new Date())}
          >
            <Text style={styles.filterButtonText}>Tháng này</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              setSelectedMonth(lastMonth);
            }}
          >
            <Text style={styles.filterButtonText}>Tháng trước</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const nextMonth = new Date();
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setSelectedMonth(nextMonth);
            }}
          >
            <Text style={styles.filterButtonText}>Tháng sau</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tháng</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={handlePrevMonth}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.yearText}>{currentYear}</Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.monthGrid}
              showsVerticalScrollIndicator={false}
            >
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthItem,
                    currentMonth === index && styles.monthItemSelected,
                  ]}
                  onPress={() => handleMonthChange(index)}
                >
                  <Text
                    style={[
                      styles.monthItemText,
                      currentMonth === index && styles.monthItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  monthButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  yearSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  monthGrid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  monthItemSelected: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primary,
  },
  monthItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  monthItemTextSelected: {
    color: colors.white,
  },
});
