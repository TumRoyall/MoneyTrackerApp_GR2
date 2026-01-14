import { colors } from "@/constants/colors";
import { Pressable, StyleSheet, Text } from "react-native";

export function FloatingAddButton() {
  return (
    <Pressable style={styles.fab}>
      <Text style={styles.plus}>＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  plus: {
    color: colors.white,
    fontSize: 28,
  },
});
