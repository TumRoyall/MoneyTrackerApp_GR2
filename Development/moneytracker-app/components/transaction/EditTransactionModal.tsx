import { colors } from "@/constants/colors";
import { Category } from "@/services/category.api";
import { Transaction } from "@/services/transaction.api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CalendarModal } from "./CalendarModal";
import { CategoryPickerModal } from "./CategoryPickerModal";

interface Props {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onSave: (data: {
    amount: number;
    categoryId: number;
    note: string;
    date: string;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function EditTransactionModal({
  visible,
  transaction,
  categories,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Sync props to local state when modal opens
  const handleOpen = () => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId);
      setNote(transaction.note);
      setDate(new Date(transaction.date));
      setCalendarDate(new Date(transaction.date));
    }
  };

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  const handleSave = async () => {
    if (!amount.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        amount: Number(amount),
        categoryId: categoryId || transaction!.categoryId,
        note: note.trim(),
        date: date.toISOString().split("T")[0],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        onShow={handleOpen}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.content}>
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Chỉnh sửa giao dịch</Text>
            </View>

            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>Số tiền</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currency}>đ</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Category */}
              <View style={styles.section}>
                <Text style={styles.label}>Danh mục</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryEmoji}>
                      {selectedCategory?.icon || "💠"}
                    </Text>
                    <Text style={styles.categoryText}>
                      {selectedCategory?.name || "Chọn danh mục"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Date */}
              <View style={styles.section}>
                <Text style={styles.label}>Ngày</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setCalendarDate(date);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Note */}
              <View style={styles.section}>
                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  placeholder="Thêm ghi chú (tùy chọn)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={submitting}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.saveText}>Lưu</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CategoryPickerModal
        visible={showCategoryPicker}
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategoryPicker(false)}
      />

      <CalendarModal
        visible={showDatePicker}
        date={calendarDate}
        onChangeMonth={(delta) => {
          const nd = new Date(calendarDate);
          nd.setMonth(nd.getMonth() + delta);
          setCalendarDate(nd);
        }}
        onSelectDate={setDate}
        onClose={() => setShowDatePicker(false)}
        showToday={true}
      />
    </>
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
    maxHeight: "90%",
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
  form: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 },
  section: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 56,
  },
  currency: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  categoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryEmoji: { fontSize: 22 },
  categoryText: { fontSize: 16, color: colors.text },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 56,
  },
  dateText: { flex: 1, fontSize: 16, color: colors.text },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  noteInput: { paddingTop: 12, height: 100, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  deleteButton: {
    flex: 0.3,
    backgroundColor: "#D9534F",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveButton: {
    flex: 0.7,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  deleteText: { fontSize: 14, fontWeight: "bold", color: colors.white },
  saveText: { fontSize: 14, fontWeight: "bold", color: colors.white },
});
