import { colors } from "@/constants/colors";
import { Category } from "@/services/category.api";
import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
}

export function CategoryPickerModal({
  visible,
  categories,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Chọn danh mục</Text>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.categoryId.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  selectedId === item.categoryId && styles.itemSelected,
                ]}
                onPress={() => {
                  onSelect(item.categoryId);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{item.icon}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                </View>
                {selectedId === item.categoryId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdrop: { flex: 1 },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CCC",
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text },
  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: { backgroundColor: "#E8F5E9", borderColor: colors.primary },
  emoji: { fontSize: 32, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  type: { fontSize: 12, color: "#999", marginTop: 2 },
});
