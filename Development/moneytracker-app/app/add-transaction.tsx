import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { getCategories } from "@/dao/CategoryDAO";
import { Account, getAccounts } from "@/services/account.api";
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
  View,
} from "react-native";

// Map LocalCategory to Category with compatible fields
interface Category {
  categoryId: string | number;
  name: string;
  icon?: string;
  color?: string;
  type: string;
}

export default function AddTransactionScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  // Form state
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string | number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch accounts and categories on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userId) {
          console.log("[AddTransaction] No userId, skipping fetch");
          setLoading(false);
          return;
        }

        const [accountsData, localCategories] = await Promise.all([
          getAccounts(),
          getCategories(userId), // Local DB
        ]);

        if (mounted) {
          setAccounts(accountsData);

          // Map local categories to compatible format
          const mappedCategories: Category[] = localCategories.map((cat) => ({
            categoryId: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
          }));

          setCategories(mappedCategories);

          // Auto-select first account
          if (accountsData.length > 0) {
            setAccountId(accountsData[0].accountId);
          }

          // Auto-select first category
          if (mappedCategories.length > 0) {
            setCategoryId(mappedCategories[0].categoryId);
          }
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        Alert.alert("Lỗi", "Không thể tải dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);
  const selectedAccount = accounts.find((a) => a.accountId === accountId);

  // Check if amount exceeds balance
  const numAmount = Number(amount) || 0;
  const isOverBalance =
    selectedAccount && numAmount > selectedAccount.currentValue;

  const onSubmit = async () => {
    if (!accountId) {
      Alert.alert("Lỗi", "Vui lòng chọn ví");
      return;
    }
    if (!amount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }
    if (!categoryId) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục");
      return;
    }

    const numAmount = Number(amount);

    // Validate amount <= balance
    if (selectedAccount && numAmount > selectedAccount.currentValue) {
      Alert.alert(
        "Không đủ tiền",
        `Số dư ví "${selectedAccount.accountName}" chỉ còn ${selectedAccount.currentValue.toLocaleString()} đ. Không thể chi tiêu ${numAmount.toLocaleString()} đ.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateTransactionRequest = {
        accountId,
        categoryId,
        amount: numAmount,
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

  if (loading) {
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

      {/* Account Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Ví</Text>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => setShowAccountPicker(true)}
        >
          <View style={styles.accountButtonContent}>
            <View>
              <Text style={styles.accountButtonName}>
                {selectedAccount?.accountName || "Chọn ví"}
              </Text>
              <Text style={styles.accountButtonType}>
                {selectedAccount?.accountType || ""}
              </Text>
            </View>
          </View>
          <View style={styles.accountButtonRight}>
            <Text style={styles.accountBalance}>
              {selectedAccount
                ? selectedAccount.currentValue.toLocaleString("vi-VN")
                : "0"}{" "}
              đ
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Số tiền</Text>
        <View
          style={[
            styles.amountInputContainer,
            isOverBalance && styles.amountInputContainerError,
          ]}
        >
          <Text
            style={[
              styles.currencySymbol,
              isOverBalance && styles.currencySymbolError,
            ]}
          >
            đ
          </Text>
          <TextInput
            style={[
              styles.amountInput,
              isOverBalance && styles.amountInputError,
            ]}
            placeholder="0"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#999"
          />
        </View>
        {isOverBalance && (
          <Text style={styles.errorText}>
            Vượt quá số dư của ví (
            {selectedAccount.currentValue.toLocaleString("vi-VN")} đ)
          </Text>
        )}
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
                    <View
                      style={[
                        styles.categoryTypeBadge,
                        item.type === "INCOME"
                          ? styles.categoryTypeBadgeIncome
                          : styles.categoryTypeBadgeExpense,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryTypeText,
                          item.type === "INCOME"
                            ? styles.categoryTypeTextIncome
                            : styles.categoryTypeTextExpense,
                        ]}
                      >
                        {item.type === "INCOME" ? "Thu nhập" : "Chi tiêu"}
                      </Text>
                    </View>
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

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ví</Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={accounts}
              keyExtractor={(item) => item.accountId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.accountItem,
                    accountId === item.accountId && styles.accountItemSelected,
                  ]}
                  onPress={() => {
                    setAccountId(item.accountId);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={styles.accountItemInfo}>
                    <Text style={styles.accountItemName}>
                      {item.accountName}
                    </Text>
                    <Text style={styles.accountItemType}>
                      {item.accountType}
                    </Text>
                  </View>
                  <View style={styles.accountItemRight}>
                    <Text style={styles.accountItemBalance}>
                      {item.currentValue.toLocaleString("vi-VN")} đ
                    </Text>
                    {accountId === item.accountId && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </View>
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
  amountInputContainerError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 8,
  },
  currencySymbolError: {
    color: "#FF3B30",
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  amountInputError: {
    color: "#FF3B30",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 6,
    marginLeft: 4,
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
  accountButton: {
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
  accountButtonContent: {
    flex: 1,
  },
  accountButtonName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  accountButtonType: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  accountButtonRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
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
    marginBottom: 4,
  },
  categoryTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTypeBadgeIncome: {
    backgroundColor: "#E8F5E9",
  },
  categoryTypeBadgeExpense: {
    backgroundColor: "#FFEBEE",
  },
  categoryTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryTypeTextIncome: {
    color: "#2E7D32",
  },
  categoryTypeTextExpense: {
    color: "#C62828",
  },
  categoryItemType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountItemSelected: {
    backgroundColor: colors.white,
  },
  accountItemInfo: {
    flex: 1,
  },
  accountItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  accountItemType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  accountItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  accountItemBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
