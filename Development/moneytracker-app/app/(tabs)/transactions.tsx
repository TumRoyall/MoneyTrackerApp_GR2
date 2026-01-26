import { colors } from "@/constants/colors";
import { Category, getCategories } from "@/services/category.api";
import {
  deleteTransaction,
  getTransactions,
  Transaction,
  TransactionFilterRequest,
  updateTransaction,
  UpdateTransactionRequest,
} from "@/services/transaction.api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TimeFilterType =
  | "Ngày"
  | "Tuần"
  | "Tháng"
  | "Năm"
  | "Mọi thời gian"
  | "Phạm vi tùy chỉnh";

interface GroupedTransaction {
  date: string;
  dateLabel: string;
  total: number;
  transactions: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("tum");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("Tháng");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTimeFilterModal, setShowTimeFilterModal] = useState(false);
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCustomFromDatePicker, setShowCustomFromDatePicker] =
    useState(false);
  const [showCustomToDatePicker, setShowCustomToDatePicker] = useState(false);
  const [customFromDateObj, setCustomFromDateObj] = useState<Date | null>(null);
  const [customToDateObj, setCustomToDateObj] = useState<Date | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map categories by id for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.categoryId, c));
    return map;
  }, [categories]);

  // Tính tổng thu chi dựa trên category.type
  const totalExpense = transactions.reduce((sum, t) => {
    const cate = categoryMap.get(t.categoryId);
    if (cate?.type === "EXPENSE") return sum + t.amount;
    return sum;
  }, 0);

  const totalIncome = transactions.reduce((sum, t) => {
    const cate = categoryMap.get(t.categoryId);
    if (cate?.type === "INCOME") return sum + t.amount;
    return sum;
  }, 0);
  const netAmount = totalIncome - totalExpense;

  // Nhóm transactions theo ngày
  const groupedTransactions: GroupedTransaction[] = transactions.reduce(
    (groups: GroupedTransaction[], transaction) => {
      const date = transaction.date;
      const existingGroup = groups.find((g) => g.date === date);
      const cate = categoryMap.get(transaction.categoryId);
      const signed =
        cate?.type === "EXPENSE" ? -transaction.amount : transaction.amount;

      if (existingGroup) {
        existingGroup.transactions.push(transaction);
        existingGroup.total += signed;
      } else {
        groups.push({
          date,
          dateLabel: formatDate(date),
          total: signed,
          transactions: [transaction],
        });
      }

      return groups;
    },
    [],
  );

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const weekDay = selectedDate.getDay();

      let fromDate: string, toDate: string;

      if (timeFilter === "Ngày") {
        fromDate = selectedDate.toISOString().split("T")[0];
        toDate = fromDate;
      } else if (timeFilter === "Tuần") {
        const first = new Date(selectedDate);
        first.setDate(day - weekDay + (weekDay === 0 ? -6 : 1));
        const last = new Date(first);
        last.setDate(first.getDate() + 6);
        fromDate = first.toISOString().split("T")[0];
        toDate = last.toISOString().split("T")[0];
      } else if (timeFilter === "Tháng") {
        fromDate = new Date(year, month, 1).toISOString().split("T")[0];
        toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
      } else if (timeFilter === "Năm") {
        fromDate = `${year}-01-01`;
        toDate = `${year}-12-31`;
      } else if (timeFilter === "Phạm vi tùy chỉnh") {
        fromDate =
          customFromDate ||
          customFromDateObj?.toISOString().split("T")[0] ||
          "";
        toDate =
          customToDate || customToDateObj?.toISOString().split("T")[0] || "";
      } else {
        // Mọi thời gian - không gửi date filter
        fromDate = "";
        toDate = "";
      }

      const filters: TransactionFilterRequest = {
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        keyword: searchQuery || undefined,
      };

      const response = await getTransactions(filters);
      setTransactions(response.content);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, timeFilter, selectedDate, customFromDate, customToDate]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [
    searchQuery,
    timeFilter,
    selectedDate,
    customFromDate,
    customToDate,
    fetchTransactions,
  ]);

  // Fetch categories once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        if (mounted) setCategories(data);
      } catch (e) {
        console.error("Error fetching categories:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];

    return `${weekday}, ${day} thg ${month}, ${year}`;
  }

  function formatCurrency(amount: number): string {
    return `đ${Math.abs(amount).toLocaleString("vi-VN")}`;
  }

  function getCategory(categoryId: number): Category | undefined {
    return categoryMap.get(categoryId);
  }

  // Generate calendar days
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays(calendarDate);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const cate = getCategory(item.categoryId);
    const isExpense = cate?.type === "EXPENSE";
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => {
          setEditingTransaction(item);
          setEditAmount(item.amount.toString());
          setEditCategoryId(item.categoryId);
          setEditNote(item.note);
          setEditDate(new Date(item.date));
          setShowEditModal(true);
        }}
      >
        <View style={styles.transactionIcon}>
          <Text
            style={[
              styles.categoryEmoji,
              { color: cate?.color || colors.primary },
            ]}
          >
            {cate?.icon || "💠"}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.categoryName}>{cate?.name || "Danh mục"}</Text>
          <Text style={styles.transactionNote}>{item.note}</Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            isExpense ? styles.expenseAmount : styles.incomeAmount,
          ]}
        >
          {formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGroupHeader = ({ item }: { item: GroupedTransaction }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateLabel}>{item.dateLabel}</Text>
      <Text
        style={[
          styles.dateTotal,
          item.total < 0 ? styles.expenseAmount : styles.incomeAmount,
        ]}
      >
        {item.total < 0 ? "" : "+"}
        {formatCurrency(item.total)}
      </Text>
    </View>
  );

  const renderGroup = ({ item }: { item: GroupedTransaction }) => (
    <View>
      {renderGroupHeader({ item })}
      {item.transactions.map((transaction, index) => (
        <View key={transaction.transactionId}>
          {renderTransactionItem({ item: transaction })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Giao dịch</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setSearchVisible(!searchVisible)}
            style={styles.iconButton}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="options-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.text}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm giao dịch..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Account Selector */}
      <View style={styles.accountSelector}>
        <Ionicons
          name="wallet"
          size={20}
          color={colors.text}
          style={styles.accountIcon}
        />
        <Text style={styles.accountName}>{selectedAccount}</Text>
      </View>

      {/* Time Filter */}
      <View style={styles.filterRow}>
        <Pressable
          style={styles.timeFilterButton}
          onPress={() => setShowTimeFilterModal(true)}
        >
          <Text style={styles.timeFilterText}>{timeFilter}</Text>
          <Ionicons name="calendar" size={16} color={colors.text} />
          <Ionicons name="chevron-down" size={16} color={colors.text} />
        </Pressable>
      </View>

      {/* Time Filter Modal */}
      <Modal
        visible={showTimeFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowTimeFilterModal(false)}
          />
          <View style={styles.timeFilterModalContent}>
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            {/* Modal Header */}
            <View style={styles.timeFilterModalHeader}>
              <Text style={styles.modalTitle}>Chọn khoảng thời gian</Text>
            </View>

            {/* Filter Options */}
            <ScrollView
              style={styles.filterOptions}
              showsVerticalScrollIndicator={false}
            >
              {/* Ngày */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Ngày" && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Ngày");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={timeFilter === "Ngày" ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Ngày" && styles.filterOptionTextSelected,
                  ]}
                >
                  Ngày
                </Text>
              </TouchableOpacity>

              {/* Tuần */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Tuần" && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Tuần");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={timeFilter === "Tuần" ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Tuần" && styles.filterOptionTextSelected,
                  ]}
                >
                  Tuần
                </Text>
              </TouchableOpacity>

              {/* Tháng */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Tháng" && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Tháng");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={timeFilter === "Tháng" ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Tháng" && styles.filterOptionTextSelected,
                  ]}
                >
                  Tháng
                </Text>
              </TouchableOpacity>

              {/* Năm */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Năm" && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Năm");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={timeFilter === "Năm" ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Năm" && styles.filterOptionTextSelected,
                  ]}
                >
                  Năm
                </Text>
              </TouchableOpacity>

              {/* Mọi thời gian */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Mọi thời gian" && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Mọi thời gian");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="infinite"
                  size={24}
                  color={
                    timeFilter === "Mọi thời gian"
                      ? colors.primary
                      : colors.text
                  }
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Mọi thời gian" &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  Mọi thời gian
                </Text>
              </TouchableOpacity>

              {/* Phạm vi tùy chỉnh */}
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  timeFilter === "Phạm vi tùy chỉnh" &&
                    styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setTimeFilter("Phạm vi tùy chỉnh");
                  setShowTimeFilterModal(false);
                }}
              >
                <Ionicons
                  name="pencil"
                  size={24}
                  color={
                    timeFilter === "Phạm vi tùy chỉnh"
                      ? colors.primary
                      : colors.text
                  }
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    timeFilter === "Phạm vi tùy chỉnh" &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  Phạm vi tùy chỉnh
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Range Input */}
      {timeFilter === "Phạm vi tùy chỉnh" && (
        <View style={styles.customDateSection}>
          <View style={styles.customDateRow}>
            <View style={styles.customDateInput}>
              <Text style={styles.customDateLabel}>Từ ngày</Text>
              <TouchableOpacity
                style={styles.customDateButton}
                onPress={() => {
                  setCalendarDate(customFromDateObj || new Date());
                  setShowCustomFromDatePicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.text}
                />
                <Text style={styles.customDateButtonText}>
                  {customFromDateObj
                    ? customFromDateObj.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Chọn ngày"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.customDateInput}>
              <Text style={styles.customDateLabel}>Đến ngày</Text>
              <TouchableOpacity
                style={styles.customDateButton}
                onPress={() => {
                  setCalendarDate(customToDateObj || new Date());
                  setShowCustomToDatePicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.text}
                />
                <Text style={styles.customDateButtonText}>
                  {customToDateObj
                    ? customToDateObj.toLocaleDateString("vi-VN", {
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
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-down" size={16} color="#D9534F" />
          <Text style={styles.expenseText}>{formatCurrency(totalExpense)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-up" size={16} color="#5CB85C" />
          <Text style={styles.incomeText}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="remove" size={16} color={colors.text} />
          <Text style={styles.netText}>
            {netAmount < 0 ? "" : "+"}
            {formatCurrency(netAmount)}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groupedTransactions}
          renderItem={renderGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-transaction")}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>

      {/* Edit Transaction Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowEditModal(false)}
          />
          <View
            style={[styles.timeFilterModalContent, styles.editModalContent]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            {/* Modal Header */}
            <View style={styles.timeFilterModalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa giao dịch</Text>
            </View>

            {/* Edit Form */}
            <ScrollView
              style={styles.editFormContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount Input */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Số tiền</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>đ</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Category Picker */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Danh mục</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => setShowEditCategoryPicker(true)}
                >
                  <View style={styles.categoryButtonContent}>
                    <Text style={styles.categoryEmoji}>
                      {categories.find((c) => c.categoryId === editCategoryId)
                        ?.icon || "💠"}
                    </Text>
                    <Text style={styles.categoryButtonText}>
                      {categories.find((c) => c.categoryId === editCategoryId)
                        ?.name || "Chọn danh mục"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Date Input */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Ngày</Text>
                <TouchableOpacity
                  style={styles.dateInputWrapper}
                  onPress={() => {
                    setCalendarDate(editDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.dateDisplayText}>
                    {editDate.toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Note Input */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  placeholder="Thêm ghi chú (tùy chọn)"
                  value={editNote}
                  onChangeText={setEditNote}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    editSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={async () => {
                    if (!editingTransaction) return;
                    setEditSubmitting(true);
                    try {
                      await deleteTransaction(editingTransaction.transactionId);
                      Alert.alert("Thành công", "Xóa giao dịch thành công!", [
                        {
                          text: "OK",
                          onPress: () => {
                            setShowEditModal(false);
                            fetchTransactions();
                          },
                        },
                      ]);
                    } catch (err) {
                      console.error("Delete failed:", err);
                      Alert.alert("Lỗi", "Không thể xóa giao dịch");
                    } finally {
                      setEditSubmitting(false);
                    }
                  }}
                  disabled={editSubmitting}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    editSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={async () => {
                    if (!editingTransaction || !editAmount.trim()) {
                      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
                      return;
                    }

                    setEditSubmitting(true);
                    try {
                      const payload: UpdateTransactionRequest = {
                        categoryId:
                          editCategoryId || editingTransaction.categoryId,
                        amount: Number(editAmount),
                        note: editNote.trim(),
                        date: editDate.toISOString().split("T")[0],
                      };

                      await updateTransaction(
                        editingTransaction.transactionId,
                        payload,
                      );
                      Alert.alert(
                        "Thành công",
                        "Cập nhật giao dịch thành công!",
                        [
                          {
                            text: "OK",
                            onPress: () => {
                              setShowEditModal(false);
                              fetchTransactions();
                            },
                          },
                        ],
                      );
                    } catch (err) {
                      console.error("Update failed:", err);
                      Alert.alert("Lỗi", "Không thể cập nhật giao dịch");
                    } finally {
                      setEditSubmitting(false);
                    }
                  }}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.saveButtonText}>Lưu</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal for Edit */}
      <Modal
        visible={showEditCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowEditCategoryPicker(false)}
          />
          <View style={styles.timeFilterModalContent}>
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.timeFilterModalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.categoryId.toString()}
              contentContainerStyle={styles.categoryPickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryPickerItem,
                    editCategoryId === item.categoryId &&
                      styles.categoryPickerItemSelected,
                  ]}
                  onPress={() => {
                    setEditCategoryId(item.categoryId);
                    setShowEditCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryPickerEmoji}>{item.icon}</Text>
                  <View style={styles.categoryPickerInfo}>
                    <Text style={styles.categoryPickerName}>{item.name}</Text>
                    <Text style={styles.categoryPickerType}>{item.type}</Text>
                  </View>
                  {editCategoryId === item.categoryId && (
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

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.calendarModalContent}>
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                Tháng {calendarDate.getMonth() + 1},{" "}
                {calendarDate.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isToday =
                  day !== null &&
                  calendarDate.getMonth() === new Date().getMonth() &&
                  calendarDate.getFullYear() === new Date().getFullYear() &&
                  day === new Date().getDate();

                const isSelected =
                  day !== null &&
                  calendarDate.getMonth() === editDate.getMonth() &&
                  calendarDate.getFullYear() === editDate.getFullYear() &&
                  day === editDate.getDate();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isToday && styles.calendarDayToday,
                      isSelected && styles.calendarDaySelected,
                    ]}
                    onPress={() => {
                      if (day !== null) {
                        const newDate = new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth(),
                          day,
                        );
                        setEditDate(newDate);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  setEditDate(new Date());
                  setCalendarDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Ionicons
                  name="today-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.todayButtonText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom From Date Picker Modal */}
      <Modal
        visible={showCustomFromDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomFromDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCustomFromDatePicker(false)}
          />
          <View style={styles.calendarModalContent}>
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                Tháng {calendarDate.getMonth() + 1},{" "}
                {calendarDate.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isToday =
                  day !== null &&
                  calendarDate.getMonth() === new Date().getMonth() &&
                  calendarDate.getFullYear() === new Date().getFullYear() &&
                  day === new Date().getDate();

                const isSelected =
                  day !== null &&
                  customFromDateObj &&
                  calendarDate.getMonth() === customFromDateObj.getMonth() &&
                  calendarDate.getFullYear() ===
                    customFromDateObj.getFullYear() &&
                  day === customFromDateObj.getDate();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isToday && styles.calendarDayToday,
                      isSelected && styles.calendarDaySelected,
                    ]}
                    onPress={() => {
                      if (day !== null) {
                        const newDate = new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth(),
                          day,
                        );
                        setCustomFromDateObj(newDate);
                        setCustomFromDate(newDate.toISOString().split("T")[0]);
                        setShowCustomFromDatePicker(false);
                      }
                    }}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  setCustomFromDateObj(today);
                  setCustomFromDate(today.toISOString().split("T")[0]);
                  setCalendarDate(today);
                  setShowCustomFromDatePicker(false);
                }}
              >
                <Ionicons
                  name="today-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.todayButtonText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom To Date Picker Modal */}
      <Modal
        visible={showCustomToDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomToDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCustomToDatePicker(false)}
          />
          <View style={styles.calendarModalContent}>
            <View style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                Tháng {calendarDate.getMonth() + 1},{" "}
                {calendarDate.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isToday =
                  day !== null &&
                  calendarDate.getMonth() === new Date().getMonth() &&
                  calendarDate.getFullYear() === new Date().getFullYear() &&
                  day === new Date().getDate();

                const isSelected =
                  day !== null &&
                  customToDateObj &&
                  calendarDate.getMonth() === customToDateObj.getMonth() &&
                  calendarDate.getFullYear() ===
                    customToDateObj.getFullYear() &&
                  day === customToDateObj.getDate();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isToday && styles.calendarDayToday,
                      isSelected && styles.calendarDaySelected,
                    ]}
                    onPress={() => {
                      if (day !== null) {
                        const newDate = new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth(),
                          day,
                        );
                        setCustomToDateObj(newDate);
                        setCustomToDate(newDate.toISOString().split("T")[0]);
                        setShowCustomToDatePicker(false);
                      }
                    }}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  setCustomToDateObj(today);
                  setCustomToDate(today.toISOString().split("T")[0]);
                  setCalendarDate(today);
                  setShowCustomToDatePicker(false);
                }}
              >
                <Ionicons
                  name="today-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.todayButtonText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  accountSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  accountIcon: {
    marginRight: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  timeFilterText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthText: {
    fontSize: 16,
    color: colors.text,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expenseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D9534F",
  },
  incomeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5CB85C",
  },
  netText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
  },
  dateTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
    color: "#666",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  expenseAmount: {
    color: "#D9534F",
  },
  incomeAmount: {
    color: "#5CB85C",
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#5A7183",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  timeFilterModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: "80%",
    minHeight: "55%",
  },
  dragHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CCC",
    borderRadius: 2,
  },
  timeFilterModalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterOptions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  filterOption: {
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
  filterOptionSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  customDateSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  customDateRow: {
    flexDirection: "row",
    gap: 12,
  },
  customDateInput: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  customDateButton: {
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
  customDateButtonText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  dateInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  editModalContent: {
    maxHeight: "90%",
  },
  editFormContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
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
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },
  dateInputWrapper: {
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
  dateTextInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoryPickerList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  categoryPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPickerItemSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: colors.primary,
  },
  categoryPickerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryPickerInfo: {
    flex: 1,
  },
  categoryPickerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  categoryPickerType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  calendarModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  calendarDayToday: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
    color: colors.text,
  },
  calendarDayTextToday: {
    color: colors.primary,
    fontWeight: "600",
  },
  calendarDayTextSelected: {
    color: colors.white,
    fontWeight: "bold",
  },
  calendarActions: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  todayButton: {
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
  todayButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});
