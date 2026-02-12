import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export type TimeFilterType =
  | "Ngày"
  | "Tuần"
  | "Tháng"
  | "Năm"
  | "Mọi thời gian"
  | "Phạm vi tùy chỉnh";

interface Props {
  visible: boolean;
  current: TimeFilterType;
  onSelect: (t: TimeFilterType) => void;
  onClose: () => void;
}

export function TimeFilterModal({
  visible,
  current,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Chọn khoảng thời gian</Text>
          </View>

          <ScrollView
            style={styles.options}
            showsVerticalScrollIndicator={false}
          >
            {(
              [
                "Ngày",
                "Tuần",
                "Tháng",
                "Năm",
                "Mọi thời gian",
                "Phạm vi tùy chỉnh",
              ] as TimeFilterType[]
            ).map((label) => {
              const selected = current === label;
              const icon =
                label === "Mọi thời gian"
                  ? "infinite"
                  : label === "Phạm vi tùy chỉnh"
                    ? "pencil"
                    : "calendar";
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(label);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selected ? colors.primary : colors.text}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBackdrop: { flex: 1 },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CCC",
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text },
  options: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  optionSelected: { backgroundColor: "#E8F5E9", borderColor: colors.primary },
  optionText: { fontSize: 16, color: colors.text, fontWeight: "500" },
  optionTextSelected: { color: colors.primary, fontWeight: "600" },
});
