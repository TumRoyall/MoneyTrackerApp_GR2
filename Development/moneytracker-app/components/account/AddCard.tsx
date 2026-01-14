import { colors } from "@/constants/colors";
import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function AddCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Plus size={20} color={colors.primary} />
      </View>
      <Text style={styles.label}>Thêm ví</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
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
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: "InterSemiBold",
  },
});
