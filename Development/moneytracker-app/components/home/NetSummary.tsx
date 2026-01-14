import { colors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export function NetSummary() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Thay đổi ròng</Text>
      <Text style={styles.net}>₫0</Text>

      <View style={styles.row}>
        <View style={styles.subCard}>
          <Text style={styles.subTitle}>Chi phí</Text>
          <Text style={styles.expense}>₫0</Text>
        </View>

        <View style={styles.subCard}>
          <Text style={styles.subTitle}>Thu nhập</Text>
          <Text style={styles.income}>₫0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 14,
  },
  net: {
    fontSize: 26,
    fontFamily: "InterBold",
    color: colors.text,
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    width: "48%",
  },
  subTitle: {
    fontSize: 13,
    color: colors.text,
  },
  expense: {
    color: colors.error,
    marginTop: 4,
  },
  income: {
    color: colors.primary,
    marginTop: 4,
  },
});
