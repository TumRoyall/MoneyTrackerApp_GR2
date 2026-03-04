import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import {
  Budget,
  createBudget,
  CreateBudgetRequest,
  deleteBudget,
  getBudgets,
  updateBudget,
  UpdateBudgetRequest,
} from "@/services/budget.api";
import { Category, getCategories } from "@/services/category.api";
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

interface BudgetWithCategory extends Budget {
  categoryInfo: Category;
}

export default function BudgetScreen() {
  const { userId } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: 0,
    amountLimit: "",
    startDate: "",
    endDate: "",
    notifyThreshold: "80",
  });

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [userId]),
  );

  const loadBudgets = async () => {
    try {
      setLoading(true);

      if (!userId) {
        setLoading(false);
        return;
      }

      const [budgetList, categoryList] = await Promise.all([
        getBudgets(userId),
        getCategories(),
      ]);

      const categoryMap = new Map(categoryList.map((c) => [c.categoryId, c]));

      const enriched = budgetList
        .map((b) => ({
          ...b,
          categoryInfo: categoryMap.get(
            b.categoryId || parseInt(b.category_id!),
          )!,
        }))
        .filter((b) => b.categoryInfo); // Remove if category not found

      setBudgets(enriched);
      setCategories(categoryList.filter((c) => c.type === "EXPENSE"));
    } catch (error) {
      console.error("Error loading budgets:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách budget");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: BudgetWithCategory) => {
    if (budget) {
      setEditingId(budget.id || null);
      setFormData({
        categoryId: budget.categoryId || parseInt(budget.category_id!),
        amountLimit: (
          budget.amountLimit ||
          budget.amount_limit ||
          0
        ).toString(),
        startDate: budget.startDate || budget.start_date || "",
        endDate: budget.endDate || budget.end_date || "",
        notifyThreshold: (
          budget.notifyThreshold ||
          budget.notify_threshold ||
          80
        ).toString(),
      });
    } else {
      // Default to current month for new budget
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setEditingId(null);
      setFormData({
        categoryId: categories[0]?.categoryId || 0,
        amountLimit: "",
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
        notifyThreshold: "80",
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (
      !formData.categoryId ||
      !formData.amountLimit ||
      !formData.startDate ||
      !formData.endDate
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy user");
      return;
    }

    const amount = parseFloat(formData.amountLimit);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Lỗi", "Số tiền phải lớn hơn 0");
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    try {
      if (editingId) {
        const updateData: UpdateBudgetRequest = {
          amountLimit: amount,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notifyThreshold: parseFloat(formData.notifyThreshold),
        };
        await updateBudget(editingId, updateData);
        Alert.alert("Thành công", "Cập nhật budget thành công");
      } else {
        const createData: CreateBudgetRequest = {
          categoryId: formData.categoryId,
          amountLimit: amount,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notifyThreshold: parseFloat(formData.notifyThreshold),
        };
        if (userId) {
          await createBudget(createData, userId);
        }
        Alert.alert("Thành công", "Tạo budget thành công");
      }

      setModalVisible(false);
      await loadBudgets();
    } catch (error) {
      console.error("Error saving budget:", error);
      Alert.alert("Lỗi", "Không thể lưu budget");
    }
  };

  const handleDelete = (id: string, categoryName: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa budget cho danh mục "${categoryName}"?`,
      [
        {
          text: "Hủy",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteBudget(id);
              await loadBudgets();
              Alert.alert("Thành công", "Xóa budget thành công");
            } catch (error) {
              console.error("Error deleting budget:", error);
              Alert.alert("Lỗi", "Không thể xóa budget");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    return `₫${amount.toLocaleString("vi-VN")}`;
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý Budget</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có budget nào</Text>
            <Text style={styles.emptySubtext}>
              Hãy tạo budget để quản lý chi tiêu
            </Text>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {budgets.map((budget) => {
              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryEmoji}>
                        {budget.categoryInfo.icon}
                      </Text>
                      <View style={styles.categoryDetails}>
                        <Text style={styles.categoryName}>
                          {budget.categoryInfo.name}
                        </Text>
                        <Text style={styles.budgetInfo}>
                          {formatCurrency(
                            budget.amountLimit || budget.amount_limit || 0,
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleOpenModal(budget)}
                      >
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          handleDelete(budget.id!, budget.categoryInfo.name)
                        }
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dateRange}>
                    <Text style={styles.dateText}>
                      {new Date(
                        budget.startDate || budget.start_date!,
                      ).toLocaleDateString("vi-VN")}{" "}
                      -{" "}
                      {new Date(
                        budget.endDate || budget.end_date!,
                      ).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>

                  <Text style={styles.thresholdText}>
                    Thông báo khi vượt{" "}
                    {budget.notifyThreshold || budget.notify_threshold}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal tạo/sửa budget */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Cập nhật Budget" : "Tạo Budget Mới"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Category Picker */}
              <Text style={styles.label}>Danh mục *</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <View style={styles.selectContent}>
                  <Text style={styles.selectText}>
                    {categories.find(
                      (c) => c.categoryId === formData.categoryId,
                    )
                      ? `${categories.find((c) => c.categoryId === formData.categoryId)?.icon} ${categories.find((c) => c.categoryId === formData.categoryId)?.name}`
                      : "Chọn danh mục"}
                  </Text>
                  <Text style={styles.selectArrow}>
                    {showCategoryPicker ? "▲" : "▼"}
                  </Text>
                </View>
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  <FlatList
                    data={categories}
                    keyExtractor={(item) => item.categoryId.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.categoryOption,
                          formData.categoryId === item.categoryId &&
                            styles.categoryOptionSelected,
                        ]}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            categoryId: item.categoryId,
                          });
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text style={styles.categoryOptionEmoji}>
                          {item.icon}
                        </Text>
                        <Text style={styles.categoryOptionName}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {/* Amount */}
              <Text style={styles.label}>Ngân sách tối đa (₫) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formData.amountLimit}
                onChangeText={(text) =>
                  setFormData({ ...formData, amountLimit: text })
                }
              />

              {/* Start Date */}
              <Text style={styles.label}>Ngày bắt đầu *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.startDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, startDate: text })
                }
              />

              {/* End Date */}
              <Text style={styles.label}>Ngày kết thúc *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.endDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, endDate: text })
                }
              />

              {/* Notify Threshold */}
              <Text style={styles.label}>Thông báo khi vượt (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                keyboardType="numeric"
                value={formData.notifyThreshold}
                onChangeText={(text) =>
                  setFormData({ ...formData, notifyThreshold: text })
                }
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingId ? "Cập nhật" : "Tạo"}
                </Text>
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
  content: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 20,
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  budgetList: {
    gap: 12,
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  budgetInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 18,
  },
  deleteIcon: {
    fontSize: 18,
  },
  dateRange: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  thresholdText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    maxHeight: "80%",
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
  select: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selectContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  selectArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryList: {
    maxHeight: 250,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.surface,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary + "20",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  categoryOptionEmoji: {
    fontSize: 24,
  },
  categoryOptionName: {
    fontSize: 14,
    color: colors.text,
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
