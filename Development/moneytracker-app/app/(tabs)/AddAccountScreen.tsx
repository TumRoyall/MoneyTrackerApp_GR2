import { colors } from "@/constants/colors";
import { AccountType, createAccount } from "@/services/account.api";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const ACCOUNT_TYPES: AccountType[] = [
  "REGULAR",
  "CASH",
  "SAVING",
  "DEBT",
  "INVEST",
  "EVENT",
];

export function AddAccountScreen({ navigation }: { navigation: any }) {
  const [accountName, setAccountName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [type, setType] = useState<AccountType>("REGULAR");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!accountName.trim()) return;
    setSubmitting(true);
    try {
      await createAccount({
        accountName: accountName.trim(),
        current_value: Number(currentValue || 0),
        currency,
        type,
      });
      navigation.goBack();
    } catch (err) {
      console.error("Create account failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo ví mới</Text>

      <Text style={styles.label}>Tên ví</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên ví"
        value={accountName}
        onChangeText={setAccountName}
      />

      <Text style={styles.label}>Số dư ban đầu</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="numeric"
        value={currentValue}
        onChangeText={setCurrentValue}
      />

      <Text style={styles.label}>Tiền tệ</Text>
      <TextInput
        style={styles.input}
        value={currency}
        onChangeText={setCurrency}
      />

      <Text style={styles.label}>Loại ví</Text>
      <View style={styles.typeRow}>
        {ACCOUNT_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, t === type && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text
              style={[
                styles.chipText,
                t === type && styles.chipTextActive,
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Tạo ví</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  title: { fontSize: 18, fontFamily: "InterSemiBold", marginBottom: 16, color: colors.text },
  label: { fontSize: 12, color: colors.secondary, marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: colors.text,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#eaf3ff" },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: colors.primary, fontFamily: "InterSemiBold" },
  button: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 15, fontFamily: "InterSemiBold" },
});