import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  totalExpense: number;
  totalIncome: number;
}

export function TransactionSummary({ totalExpense, totalIncome }: Props) {
  const netAmount = totalIncome - totalExpense;

  function formatCurrency(amount: number): string {
    return `đ${Math.abs(amount).toLocaleString("vi-VN")}`;
  }

  return (
    <View style={styles.summary}>
      <View style={styles.item}>
        <Ionicons name="arrow-down" size={18} color={colors.error} />
        <Text style={styles.expense}>{formatCurrency(totalExpense)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="arrow-up" size={18} color={colors.success} />
        <Text style={styles.income}>{formatCurrency(totalIncome)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="remove" size={18} color={colors.textSecondary} />
        <Text
          style={[
            styles.net,
            netAmount < 0 ? styles.netExpense : styles.netIncome,
          ]}
        >
          {netAmount < 0 ? "" : "+"}
          {formatCurrency(netAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 8 },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  expense: {
    ...typography.smallBold,
    color: colors.error,
  },
  income: {
    ...typography.smallBold,
    color: colors.success,
  },
  net: {
    ...typography.smallBold,
  },
  netExpense: {
    color: colors.error,
  },
  netIncome: {
    color: colors.success,
  },
});
