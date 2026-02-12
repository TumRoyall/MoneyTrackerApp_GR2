import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_EMOJI_OPTIONS,
} from "@/constants/category-icons";
import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import {
  createCategory,
  CreateCategoryPayload,
  getCategoriesByType,
} from "@/dao/CategoryDAO";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
  is_default: number;
}

export default function ManageCategoriesScreen() {
  const { userId, isLoggedIn } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE",
  );
  const [modalVisible, setModalVisible] = useState(false);

  console.log("[ManageCategories] userId:", userId, "isLoggedIn:", isLoggedIn);

  const [formData, setFormData] = useState({
    name: "",
    icon: "📝",
    color: "#FF6B6B",
  });

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [selectedType, userId]),
  );

  const loadCategories = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const categoryList = await getCategoriesByType(userId, selectedType);
      setCategories(categoryList);
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      icon: "📝",
      color: "#FF6B6B",
    });
    setModalVisible(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên danh mục");
      return;
    }

    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy user. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const payload: CreateCategoryPayload = {
        name: formData.name.trim(),
        type: selectedType,
        icon: formData.icon,
        color: formData.color,
      };

      console.log("[ManageCategories] Creating category with userId:", userId);
      await createCategory(userId, payload);
      Alert.alert("Thành công", "Tạo danh mục thành công");
      setModalVisible(false);
      await loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Lỗi", `Không thể tạo danh mục: ${error}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý Danh mục</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === "EXPENSE" && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType("EXPENSE")}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === "EXPENSE" && styles.typeButtonTextActive,
              ]}
            >
              Chi tiêu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === "INCOME" && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType("INCOME")}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === "INCOME" && styles.typeButtonTextActive,
              ]}
            >
              Thu nhập
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: item.color || "#FF6B6B" },
                  ]}
                >
                  <Text style={styles.icon}>{item.icon || "📝"}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  {item.is_default === 1 && (
                    <Text style={styles.defaultBadge}>Mặc định</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      </View>

      {/* Modal tạo danh mục */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Danh Mục Mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Name */}
              <Text style={styles.label}>Tên danh mục *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên danh mục"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />

              {/* Icon Picker */}
              <Text style={styles.label}>Chọn biểu tượng</Text>
              <View style={styles.emojiGrid}>
                {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      formData.icon === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, icon: emoji })}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Picker */}
              <Text style={styles.label}>Chọn màu sắc</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>

              {/* Preview */}
              <Text style={styles.label}>Xem trước</Text>
              <View style={styles.preview}>
                <View
                  style={[
                    styles.previewIconContainer,
                    { backgroundColor: formData.color },
                  ]}
                >
                  <Text style={styles.previewIcon}>{formData.icon}</Text>
                </View>
                <Text style={styles.previewText}>
                  {formData.name || "Tên danh mục"}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreate}
              >
                <Text style={styles.saveButtonText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  typeToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  categoryInfo: {
    gap: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  defaultBadge: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  emojiOption: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "20",
  },
  emojiText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: colors.text,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  previewIcon: {
    fontSize: 24,
  },
  previewText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
