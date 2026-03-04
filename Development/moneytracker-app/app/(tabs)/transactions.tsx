import { CustomDateRange } from "@/components/transaction/CustomDateRange";
import { EditTransactionModal } from "@/components/transaction/EditTransactionModal";
import {
  TimeFilterModal,
  TimeFilterType,
} from "@/components/transaction/TimeFilterModal";
import { TransactionItem } from "@/components/transaction/TransactionItem";
import { TransactionSummary } from "@/components/transaction/TransactionSummary";
import { WalletSelectorModal } from "@/components/transaction/WalletSelectorModal";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Account, getAccounts } from "@/services/account.api";
import { Category, getCategories } from "@/services/category.api";
import {
  deleteTransaction,
  getTransactions,
  Transaction,
  TransactionFilterRequest,
  updateTransaction,
} from "@/services/transaction.api";
import { calculateDateRange, formatDate } from "@/utils/transaction.utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("Tháng");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTimeFilterModal, setShowTimeFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [customFromDateObj, setCustomFromDateObj] = useState<Date | null>(null);
  const [customToDateObj, setCustomToDateObj] = useState<Date | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

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
      if (!selectedAccountId) {
        setTransactions([]);
        return;
      }
      const { fromDate, toDate } = calculateDateRange(
        timeFilter,
        selectedDate,
        customFromDateObj,
        customToDateObj,
      );

      const filters: TransactionFilterRequest = {
        accountId: selectedAccountId,
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
  }, [
    searchQuery,
    timeFilter,
    selectedDate,
    customFromDateObj,
    customToDateObj,
    selectedAccountId,
  ]);

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
    customFromDateObj,
    customToDateObj,
    selectedAccountId,
    fetchTransactions,
  ]);

  // Fetch accounts and set default selected account
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAccounts();
        if (!mounted) return;
        setAccounts(data);
        if (data.length > 0) {
          setSelectedAccountId(data[0].accountId);
          setSelectedAccountName(data[0].accountName);
        }
      } catch (e) {
        console.error("Error fetching accounts:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const regularAccounts = useMemo(
    () => accounts.filter((a) => a.type === "REGULAR"),
    [accounts],
  );

  // Fetch accounts and set default REGULAR account
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAccounts();
        if (!mounted) return;
        setAccounts(data);
        const regs = data.filter((a) => a.type === "REGULAR");
        if (regs.length > 0) {
          setSelectedAccountId(regs[0].accountId);
          setSelectedAccountName(regs[0].accountName);
        } else {
          setSelectedAccountId(null);
          setSelectedAccountName("");
        }
      } catch (e) {
        console.error("Error fetching accounts:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function getCategory(categoryId: number): Category | undefined {
    return categoryMap.get(categoryId);
  }

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const cate = getCategory(item.categoryId);
    return (
      <TransactionItem
        item={item}
        category={cate}
        onPress={(txn) => {
          setEditingTransaction(txn);
          setShowEditModal(true);
        }}
      />
    );
  };

  const renderGroupHeader = ({ item }: { item: GroupedTransaction }) => {
    function formatCurrency(amount: number): string {
      return `đ${Math.abs(amount).toLocaleString("vi-VN")}`;
    }

    return (
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
  };

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
      <TouchableOpacity
        style={styles.accountSelector}
        onPress={() => setShowAccountModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons
          name="wallet"
          size={20}
          color={colors.text}
          style={styles.accountIcon}
        />
        <Text style={styles.accountName}>
          {selectedAccountName || "Chọn ví (REGULAR)"}
        </Text>
      </TouchableOpacity>

      {/* Wallet Selector Modal */}
      <WalletSelectorModal
        visible={showAccountModal}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelect={(accountId, accountName) => {
          setSelectedAccountId(accountId);
          setSelectedAccountName(accountName);
          fetchTransactions();
        }}
        onClose={() => setShowAccountModal(false)}
      />

      {/* Time Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.timeFilterButton}
          onPress={() => setShowTimeFilterModal(true)}
        >
          <Text style={styles.timeFilterText}>{timeFilter}</Text>
          <Ionicons name="calendar" size={16} color={colors.text} />
          <Ionicons name="chevron-down" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Time Filter Modal */}
      <TimeFilterModal
        visible={showTimeFilterModal}
        current={timeFilter}
        onSelect={(t) => setTimeFilter(t)}
        onClose={() => setShowTimeFilterModal(false)}
      />

      {/* Custom Date Range Input */}
      {timeFilter === "Phạm vi tùy chỉnh" && (
        <CustomDateRange
          fromDate={customFromDateObj}
          toDate={customToDateObj}
          onFromDateChange={(d) => setCustomFromDateObj(d)}
          onToDateChange={(d) => setCustomToDateObj(d)}
        />
      )}

      {/* Summary */}
      <TransactionSummary
        totalExpense={totalExpense}
        totalIncome={totalIncome}
      />

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
      <EditTransactionModal
        visible={showEditModal}
        transaction={editingTransaction}
        categories={categories}
        onSave={async (data) => {
          if (!editingTransaction) return;
          await updateTransaction(editingTransaction.transactionId, data);
          Alert.alert("Thành công", "Cập nhật giao dịch thành công!", [
            {
              text: "OK",
              onPress: () => {
                setShowEditModal(false);
                fetchTransactions();
              },
            },
          ]);
        }}
        onDelete={async () => {
          if (!editingTransaction) return;
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
        }}
        onClose={() => setShowEditModal(false)}
      />
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
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  accountSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
  },
  accountIcon: {
    marginRight: 4,
  },
  accountName: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timeFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
  },
  timeFilterText: {
    ...typography.smallMedium,
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
    ...typography.smallMedium,
    color: colors.textSecondary,
  },
  dateTotal: {
    ...typography.smallBold,
  },
  expenseAmount: {
    color: colors.error,
  },
  incomeAmount: {
    color: colors.success,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
