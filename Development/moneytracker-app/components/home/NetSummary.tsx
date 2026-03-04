import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { getAccounts } from "@/services/account.api";
import { getCategories } from "@/services/category.api";
import { getTransactions } from "@/services/transaction.api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function NetSummary() {
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const fromDate = firstDay.toISOString().split("T")[0];
        const toDate = lastDay.toISOString().split("T")[0];

        // Get ALL REGULAR accounts
        const accounts = await getAccounts();
        const regularAccounts = accounts.filter((a) => a.type === "REGULAR");

        if (regularAccounts.length === 0) {
          setLoading(false);
          return;
        }

        const [categories] = await Promise.all([getCategories()]);

        const categoryMap = new Map(categories.map((c) => [c.categoryId, c]));
        let totalExp = 0;
        let totalInc = 0;

        // Fetch and aggregate from all accounts
        const txnPromises = regularAccounts.map((acc) =>
          getTransactions({
            accountId: acc.accountId,
            fromDate,
            toDate,
          }),
        );

        const allTxnResults = await Promise.all(txnPromises);

        allTxnResults.forEach((txnRes) => {
          txnRes.content?.forEach((txn: any) => {
            const cat = categoryMap.get(txn.categoryId);
            if (cat?.type === "EXPENSE") {
              totalExp += txn.amount;
            } else {
              totalInc += txn.amount;
            }
          });
        });

        setExpense(totalExp);
        setIncome(totalInc);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const net = income - expense;

  const formatCurrency = (amount: number) => {
    return `₫${Math.abs(amount).toLocaleString("vi-VN")}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Tháng này</Text>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.textSecondary}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.netSection}>
            <Text style={styles.netLabel}>Thay đổi ròng</Text>
            <Text
              style={[
                styles.netAmount,
                net >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {net >= 0 ? "+" : ""}
              {formatCurrency(net)}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, styles.expenseIcon]}>
                <Ionicons name="arrow-down" size={16} color={colors.error} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Chi phí</Text>
                <Text style={[styles.statAmount, styles.expenseAmount]}>
                  {formatCurrency(expense)}
                </Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <View style={[styles.statIcon, styles.incomeIcon]}>
                <Ionicons name="arrow-up" size={16} color={colors.success} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statAmount, styles.incomeAmount]}>
                  {formatCurrency(income)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  netSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  netLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  netAmount: {
    ...typography.h3,
    fontWeight: "700",
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  expenseIcon: {
    backgroundColor: "#FEE2E2",
  },
  incomeIcon: {
    backgroundColor: "#F0FDF4",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statAmount: {
    ...typography.bodySemibold,
  },
  expenseAmount: {
    color: colors.error,
  },
  incomeAmount: {
    color: colors.success,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
    marginHorizontal: 12,
  },
});
