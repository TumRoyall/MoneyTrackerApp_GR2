import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { StyleSheet, Text, View } from "react-native";

export function HomeHeader() {
  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Buổi sáng tốt lành"
      : today.getHours() < 18
        ? "Buổi chiều tốt lành"
        : "Buổi tối tốt lành";

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting} 👋</Text>
      <Text style={styles.subtitle}>Quản lý tài chính của bạn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  greeting: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
