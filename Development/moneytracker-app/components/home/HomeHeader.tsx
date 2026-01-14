import { colors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export function HomeHeader() {
  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>🏆 Những cột mốc</Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>📊 Phân tích thêm</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
  },
});
