import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { getAccounts } from "@/services/account.api";
import { Budget, getActiveBudgets } from "@/services/budget.api";
import { Category, getCategories } from "@/services/category.api";
import { getTransactions } from "@/services/transaction.api";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface CategorySpending {
  category: Category;
  amount: number;
  budget?: Budget;
  budgetUsed: number; // percentage 0-100
}

export function TopSpendingCategories() {
  const { userId } = useAuth();
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchTopCategories();
    }, []),
  );

  const fetchTopCategories = async () => {
    try {
      setLoading(true);

      if (!userId) {
        setLoading(false);
        return;
      }

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

      const [categories, budgets] = await Promise.all([
        getCategories(),
        userId ? getActiveBudgets(userId) : Promise.resolve([]),
      ]);

      const categoryMap = new Map(categories.map((c) => [c.categoryId, c]));
      const budgetMap = new Map(
        budgets.map((b) => [b.categoryId || b.category_id, b]),
      );
      const categorySpending = new Map<number, number>();

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
          // Only count EXPENSE categories
          if (cat?.type === "EXPENSE") {
            const current = categorySpending.get(txn.categoryId) || 0;
            categorySpending.set(txn.categoryId, current + txn.amount);
          }
        });
      });

      // Convert to array and sort
      const spending: CategorySpending[] = Array.from(
        categorySpending.entries(),
      )
        .map(([catId, amount]) => {
          const budget = budgetMap.get(catId);
          const budgetUsed = budget
            ? Math.min(
                100,
                (amount / (budget.amountLimit || budget.amount_limit || 1)) *
                  100,
              )
            : 0;

          return {
            category: categoryMap.get(catId)!,
            amount,
            budget,
            budgetUsed,
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5

      setTopCategories(spending);
    } catch (error) {
      console.error("Error fetching top categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₫${amount.toLocaleString("vi-VN")}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chi tiêu theo danh mục</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chi tiêu theo danh mục</Text>

      {topCategories.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có chi tiêu tháng này</Text>
      ) : (
        <View style={styles.categoryList}>
          {topCategories.map((item) => {
            const exceeded =
              item.budget &&
              item.budget.amountLimit &&
              item.amount > item.budget.amountLimit;

            return (
              <View key={item.category.categoryId} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryEmoji}>{item.category.icon}</Text>
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryName}>
                      {item.category.name}
                    </Text>
                    <View style={styles.amountRow}>
                      <Text
                        style={[
                          styles.categoryAmount,
                          exceeded ? styles.amountExceeded : undefined,
                        ]}
                      >
                        {formatCurrency(item.amount)}
                      </Text>
                      {item.budget && item.budget.amountLimit && (
                        <Text style={styles.budgetText}>
                          / {formatCurrency(item.budget.amountLimit)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        exceeded ? styles.progressFillExceeded : undefined,
                        {
                          width: `${Math.min(
                            item.budget && item.budget.amountLimit
                              ? (item.amount / item.budget.amountLimit) * 100
                              : (item.amount / topCategories[0].amount) * 100,
                            100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {item.budget && item.budget.amountLimit
                      ? `${Math.round(item.budgetUsed)}%`
                      : "-"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  loadingContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryAmount: {
    fontSize: 13,
    color: colors.error,
    fontWeight: "500",
  },
  amountExceeded: {
    color: colors.error,
    fontWeight: "700",
  },
  budgetText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressFillExceeded: {
    backgroundColor: colors.error,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    minWidth: 30,
    textAlign: "right",
  },
});
