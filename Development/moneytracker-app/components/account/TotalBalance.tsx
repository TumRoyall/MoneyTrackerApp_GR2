import { colors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export function TotalBalance({ total }: { total: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Tổng số dư</Text>
      <Text style={styles.value}>
        {total.toLocaleString()} VND
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    color: colors.background,
    fontSize: 14,
  },
  value: {
    color: colors.white,
    fontSize: 30,
    fontFamily: "InterBold",
    marginTop: 6,
  },
});
