import { colors } from "@/constants/colors";
import { Category } from "@/services/category.api";
import { Transaction } from "@/services/transaction.api";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: Transaction;
  category?: Category;
  onPress?: (txn: Transaction) => void;
}

export function TransactionItem({ item, category, onPress }: Props) {
  const isExpense = category?.type === "EXPENSE";

  function formatCurrency(amount: number): string {
    return `đ${Math.abs(amount).toLocaleString("vi-VN")}`;
  }

  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.transactionIcon}>
        <Text
          style={[
            styles.categoryEmoji,
            { color: category?.color || colors.primary },
          ]}
        >
          {category?.icon || "💠"}
        </Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.categoryName}>{category?.name || "Danh mục"}</Text>
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
}

const styles = StyleSheet.create({
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
  categoryEmoji: {
    fontSize: 22,
  },
  transactionInfo: {
    flex: 1,
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
});
