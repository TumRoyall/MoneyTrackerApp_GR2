import { AccountCard } from "@/components/account/AccountCard";
import { AddCard } from "@/components/account/AddCard";
import { colors } from "@/constants/colors";
import { Account, deleteAccount, getAccounts } from "@/services/account.api";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

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
    }, [])
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

  if (loading) {
    return (
      <View>
        <Text style={styles.title}>Ví của bạn</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Ví của bạn</Text>

      <View style={styles.grid}>
        {accounts.map((account) => (
          <AccountCard
            key={account.accountId}
            account={account}
            onDelete={handleDelete}
          />
        ))}
        <AddCard onPress={handleAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: "InterSemiBold",
    marginBottom: 12,
    color: colors.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadingContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
});