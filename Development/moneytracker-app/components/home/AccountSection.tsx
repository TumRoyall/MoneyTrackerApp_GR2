import { AddCard } from "@/components/account/AddCard";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Account, deleteAccount, getAccounts } from "@/services/account.api";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function AccountSection() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, []),
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount(id);
      setAccounts(accounts.filter((acc) => acc.accountId !== id));
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handleAdd = () => {
    router.push("/add-account");
  };

  const regularAccounts = accounts.filter((a) => a.type === "REGULAR");

  if (loading) {
    return (
      <View>
        <View style={styles.header}>
          <Text style={styles.title}>Ví của bạn</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push("/add-account")}
          >
            <Text style={styles.viewAllText}>Quản lý</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ví của bạn</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("/add-account")}
        >
          <Text style={styles.viewAllText}>Thêm tài khoản</Text>
        </TouchableOpacity>
      </View>

      {regularAccounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AddCard onPress={handleAdd} />
        </View>
      ) : (
        <View style={styles.accountsGrid}>
          {regularAccounts.slice(0, 2).map((account) => (
            <View key={account.accountId} style={styles.compactCard}>
              <View style={styles.compactCardHeader}>
                <Text style={styles.compactCardName}>
                  {account.accountName}
                </Text>
              </View>
              <Text style={styles.compactCardBalance}>
                {account.currentValue.toLocaleString("vi-VN")}
              </Text>
              <Text style={styles.compactCardCurrency}>{account.currency}</Text>
            </View>
          ))}
          {regularAccounts.length < 2 && (
            <View style={styles.compactAddCard}>
              <TouchableOpacity onPress={handleAdd}>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  viewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "600",
  },
  loadingContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  accountsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  compactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCardHeader: {
    marginBottom: 8,
  },
  compactCardName: {
    ...typography.small,
    color: colors.textSecondary,
  },
  compactCardBalance: {
    ...typography.bodySemibold,
    color: colors.primary,
    marginBottom: 4,
  },
  compactCardCurrency: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  compactAddCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 80,
  },
  addIcon: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
