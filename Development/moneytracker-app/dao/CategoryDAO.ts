import { executeSQL, fetchOne, fetchRows } from "../db/init";

/* ===================== TYPES ===================== */

export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  server_id?: number;
  user_id?: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  is_default: number;
  version: number;
  updated_at: number;
  deleted_at?: number;
  sync_status: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

/* ===================== DAO ===================== */

/**
 * Get all categories (default + user categories)
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
  const categories = await fetchRows<Category>(
    `SELECT * FROM categories 
     WHERE (user_id = ? OR is_default = 1) AND deleted_at IS NULL 
     ORDER BY is_default DESC, name ASC`,
    [userId],
  );
  return categories;
};

/**
 * Get categories by type
 */
export const getCategoriesByType = async (
  userId: string,
  type: CategoryType,
): Promise<Category[]> => {
  return fetchRows<Category>(
    `SELECT * FROM categories 
     WHERE (user_id = ? OR is_default = 1) AND type = ? AND deleted_at IS NULL 
     ORDER BY is_default DESC, name ASC`,
    [userId, type],
  );
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  return fetchOne<Category>(
    `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
};

/**
 * Create new category
 */
export const createCategory = async (
  userId: string,
  payload: CreateCategoryPayload,
): Promise<Category> => {
  const id = generateUUID();
  const now = Date.now();

  await executeSQL(
    `INSERT INTO categories (
      id, user_id, name, type, icon, color, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      payload.name,
      payload.type,
      payload.icon || null,
      payload.color || null,
      now,
      "PENDING",
    ],
  );

  const category = await getCategoryById(id);
  if (!category) throw new Error("Failed to create category");
  return category;
};

/**
 * Update category
 */
export const updateCategory = async (
  id: string,
  payload: Partial<CreateCategoryPayload>,
): Promise<Category> => {
  const now = Date.now();
  const updateFields: string[] = [];
  const values: any[] = [];

  if (payload.name) {
    updateFields.push("name = ?");
    values.push(payload.name);
  }
  if (payload.type) {
    updateFields.push("type = ?");
    values.push(payload.type);
  }
  if (payload.icon !== undefined) {
    updateFields.push("icon = ?");
    values.push(payload.icon);
  }
  if (payload.color !== undefined) {
    updateFields.push("color = ?");
    values.push(payload.color);
  }

  if (updateFields.length > 0) {
    updateFields.push("updated_at = ?");
    values.push(now);
    updateFields.push("sync_status = ?");
    values.push("PENDING");
    values.push(id);

    await executeSQL(
      `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`,
      values,
    );
  }

  const category = await getCategoryById(id);
  if (!category) throw new Error("Failed to update category");
  return category;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const now = Date.now();
  await executeSQL(
    `UPDATE categories SET deleted_at = ?, sync_status = ? WHERE id = ?`,
    [now, "PENDING", id],
  );
};

/**
 * Initialize default categories
 */
export const initializeDefaultCategories = async (
  userId: string,
): Promise<void> => {
  const defaults = [
    {
      name: "Ăn uống",
      type: "EXPENSE" as CategoryType,
      icon: "🍔",
      color: "#FF6B6B",
    },
    {
      name: "Giao thông",
      type: "EXPENSE" as CategoryType,
      icon: "🚗",
      color: "#4ECDC4",
    },
    {
      name: "Mua sắm",
      type: "EXPENSE" as CategoryType,
      icon: "🛍️",
      color: "#FFE66D",
    },
    {
      name: "Giải trí",
      type: "EXPENSE" as CategoryType,
      icon: "🎬",
      color: "#95E1D3",
    },
    {
      name: "Hóa đơn",
      type: "EXPENSE" as CategoryType,
      icon: "📄",
      color: "#A8E6CF",
    },
    {
      name: "Sức khỏe",
      type: "EXPENSE" as CategoryType,
      icon: "⚕️",
      color: "#FFDDC1",
    },
    {
      name: "Lương",
      type: "INCOME" as CategoryType,
      icon: "💰",
      color: "#2E8B57",
    },
    {
      name: "Thưởng",
      type: "INCOME" as CategoryType,
      icon: "🎁",
      color: "#228B22",
    },
    {
      name: "Đầu tư",
      type: "INCOME" as CategoryType,
      icon: "📈",
      color: "#20B2AA",
    },
  ];

  for (const cat of defaults) {
    const id = generateUUID();
    const now = Date.now();

    await executeSQL(
      `INSERT OR IGNORE INTO categories (
        id, user_id, name, type, icon, color, is_default, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, null, cat.name, cat.type, cat.icon, cat.color, 1, now, "SYNCED"],
    );
  }
};

/**
 * Helper to generate UUID
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
