import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const TOOLS: ToolItem[] = [
  {
    id: "categories",
    title: "Quản lý Danh mục",
    description: "Tạo và quản lý các danh mục chi tiêu & thu nhập",
    icon: "apps",
    route: "/manage-categories",
  },
  // Có thể thêm tools khác ở đây
];

export default function Tools() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Công cụ</Text>
      </View>

      <View style={styles.toolsList}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.toolCard}
            onPress={() => router.push(tool.route as any)}
          >
            <View style={styles.toolIcon}>
              <Ionicons name={tool.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  toolsList: {
    padding: 16,
    gap: 12,
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
