import { colors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export function TimeFilter() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tháng</Text>
      <Text style={styles.value}>Tháng 1 năm 2026 ▼</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    color: colors.text,
  },
});
