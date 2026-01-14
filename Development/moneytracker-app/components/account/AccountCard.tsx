import { colors } from "@/constants/colors";
import { Account } from "@/services/account.api";
import { Wallet } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function AccountCard({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: number) => void;
}) {
  return (
    <View style={styles.card}>
      {/* Delete button (hover -> always visible on mobile) */}
      <Pressable
        onPress={() => onDelete(account.accountId)}
        style={styles.deleteBtn}
        hitSlop={10}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>

      {/* Icon */}
      <View style={styles.iconWrap}>
        <Wallet size={20} color={colors.primary} />
      </View>

      {/* Account info */}
      <View>
        <Text style={styles.name}>{account.accountName}</Text>
        <Text style={styles.balance}>
          {account.currentValue.toLocaleString("vi-VN")}
        </Text>
        <Text style={styles.currency}>{account.currency}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
    width: "47%",
    minHeight: 110,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
  },

  deleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  name: {
    fontSize: 11,
    color: colors.primary,
    marginBottom: 2,
  },

  balance: {
    fontSize: 15,
    fontFamily: "InterSemiBold",
    color: colors.text,
    marginBottom: 1,
  },

  currency: {
    fontSize: 10,
    color: colors.secondary,
  },
});

