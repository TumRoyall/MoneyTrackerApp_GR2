import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Account } from "@/services/account.api";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WalletSelectorModalProps {
  visible: boolean;
  accounts: Account[];
  selectedAccountId: number | null;
  onSelect: (accountId: number, accountName: string) => void;
  onClose: () => void;
}

export function WalletSelectorModal({
  visible,
  accounts,
  selectedAccountId,
  onSelect,
  onClose,
}: WalletSelectorModalProps) {
  const regularAccounts = accounts.filter((a) => a.type === "REGULAR");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Chọn ví (REGULAR)</Text>

          {regularAccounts.length === 0 ? (
            <Text style={styles.noAccounts}>Không có ví REGULAR</Text>
          ) : (
            regularAccounts.map((acc) => (
              <TouchableOpacity
                key={acc.accountId}
                style={[
                  styles.accountItem,
                  selectedAccountId === acc.accountId &&
                    styles.accountItemSelected,
                ]}
                onPress={() => {
                  onSelect(acc.accountId, acc.accountName);
                  onClose();
                }}
              >
                <Ionicons name="wallet" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.accountItemText}>{acc.accountName}</Text>
                  <Text style={styles.accountSubText}>{acc.currency}</Text>
                </View>
                {selectedAccountId === acc.accountId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  box: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 16,
  },
  noAccounts: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: 16,
    textAlign: "center",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountItemSelected: {
    backgroundColor: "#F0F5EC",
  },
  accountItemText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  accountSubText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    ...typography.button,
    color: colors.white,
  },
});
