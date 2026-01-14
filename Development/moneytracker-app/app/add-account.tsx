import { colors } from "@/constants/colors";
import { createAccount } from "@/services/account.api";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function AddAccountScreen() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!accountName.trim()) return;
    setSubmitting(true);
    try {
      await createAccount({
        accountName: accountName.trim(),
        current_value: Number(currentValue || 0),
        currency,
        type: "REGULAR",
        description: description.trim(),
      });
      Alert.alert("Thành công", "Tạo ví thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Create account failed:", err);
      Alert.alert("Lỗi", "Không thể tạo ví, thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo ví mới</Text>

      <Text style={styles.label}>Tên ví</Text>
      <TextInput style={styles.input} placeholder="Nhập tên ví" value={accountName} onChangeText={setAccountName} />

      <Text style={styles.label}>Số dư ban đầu</Text>
      <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={currentValue} onChangeText={setCurrentValue} />

      <Text style={styles.label}>Tiền tệ</Text>
      <TextInput style={styles.input} value={currency} onChangeText={setCurrency} />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Nhập mô tả (tùy chọn)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Tạo ví</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  title: { fontSize: 18, fontFamily: "InterSemiBold", marginBottom: 16, color: colors.text },
  label: { fontSize: 12, color: colors.secondary, marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14, color: colors.text },
  textArea: { height: 80, textAlignVertical: "top" },
  button: { marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 15, fontFamily: "InterSemiBold" },
});