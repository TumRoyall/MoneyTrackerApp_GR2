import { colors } from "@/constants/colors";
import { Category, getCategories } from "@/services/category.api";
import {
    createTransaction,
    CreateTransactionRequest,
} from "@/services/transaction.api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function AddTransactionScreen() {
  const router = useRouter();

  // Form state
  const [accountId, setAccountId] = useState<number>(3); // Default account
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getCategories();
        if (mounted) {
          setCategories(data);
          // Auto-select first category
          if (data.length > 0) {
            setCategoryId(data[0].categoryId);
          }
        }
      } catch (e) {
        console.error("Error fetching categories:", e);
        Alert.alert("Lỗi", "Không thể tải danh mục");
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  const onSubmit = async () => {
    if (!amount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }
    if (!categoryId) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateTransactionRequest = {
        accountId,
        categoryId,
        amount: Number(amount),
        note: note.trim(),
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
      };

      await createTransaction(payload);
      Alert.alert("Thành công", "Tạo giao dịch thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Create transaction failed:", err);
      Alert.alert("Lỗi", "Không thể tạo giao dịch, thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm giao dịch</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Số tiền</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>đ</Text>
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

      {/* Category Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Danh mục</Text>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryPicker(true)}
        >
          <View style={styles.categoryButtonContent}>
            <Text style={styles.categoryEmoji}>
              {selectedCategory?.icon || "💠"}
            </Text>
            <Text style={styles.categoryButtonText}>
              {selectedCategory?.name || "Chọn danh mục"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Ngày</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note Input */}
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

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Tạo giao dịch</Text>
        )}
      </TouchableOpacity>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.categoryId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    categoryId === item.categoryId &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(item.categoryId);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryItemEmoji}>{item.icon}</Text>
                  <View style={styles.categoryItemInfo}>
                    <Text style={styles.categoryItemName}>{item.name}</Text>
                    <Text style={styles.categoryItemType}>{item.type}</Text>
                  </View>
                  {categoryId === item.categoryId && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 56,
  },
  currencySymbol: {
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
  categoryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryButtonText: {
    fontSize: 16,
    color: colors.text,
  },
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
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
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
  noteInput: {
    paddingTop: 12,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
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
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemSelected: {
    backgroundColor: colors.white,
  },
  categoryItemEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryItemInfo: {
    flex: 1,
  },
  categoryItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  categoryItemType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
