import * as SQLite from "expo-sqlite";

/**
 * Default categories to seed on first launch
 */
const DEFAULT_CATEGORIES = [
  // EXPENSE Categories
  { name: "Ăn uống", type: "EXPENSE", icon: "🍔", color: "#FF6B6B" },
  { name: "Di chuyển", type: "EXPENSE", icon: "🚗", color: "#4ECDC4" },
  { name: "Mua sắm", type: "EXPENSE", icon: "🛍️", color: "#FFE66D" },
  { name: "Giải trí", type: "EXPENSE", icon: "🎮", color: "#95E1D3" },
  { name: "Hóa đơn", type: "EXPENSE", icon: "💡", color: "#F38181" },
  { name: "Sức khỏe", type: "EXPENSE", icon: "🏥", color: "#AA96DA" },
  { name: "Giáo dục", type: "EXPENSE", icon: "📚", color: "#FCBAD3" },
  { name: "Nhà cửa", type: "EXPENSE", icon: "🏠", color: "#A8D8EA" },
  { name: "Quần áo", type: "EXPENSE", icon: "👕", color: "#FFD93D" },
  { name: "Làm đẹp", type: "EXPENSE", icon: "💄", color: "#F76B8A" },
  { name: "Quà tặng", type: "EXPENSE", icon: "🎁", color: "#FFA69E" },
  { name: "Khác", type: "EXPENSE", icon: "📝", color: "#C7CEEA" },

  // INCOME Categories
  { name: "Lương", type: "INCOME", icon: "💰", color: "#6BCB77" },
  { name: "Thưởng", type: "INCOME", icon: "🎉", color: "#4D96FF" },
  { name: "Đầu tư", type: "INCOME", icon: "📈", color: "#FFD32D" },
  { name: "Kinh doanh", type: "INCOME", icon: "💼", color: "#05DFD7" },
  { name: "Thu nhập khác", type: "INCOME", icon: "💵", color: "#9191E9" },
];

/**
 * Seed default categories into database
 */
export const seedDefaultCategories = async (
  database: SQLite.SQLiteDatabase,
): Promise<void> => {
  try {
    // Check if categories already exist
    const result = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM categories WHERE is_default = 1",
    );

    if (result && result.count > 0) {
      console.log("[Seed] Default categories already exist, skipping seed");
      return;
    }

    console.log("[Seed] Seeding default categories...");

    const now = Date.now();

    for (const category of DEFAULT_CATEGORIES) {
      const id = `cat_default_${category.name.replace(/\s+/g, "_").toLowerCase()}`;

      await database.runAsync(
        `INSERT INTO categories (
          id, user_id, name, type, icon, color, is_default, version, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          null, // user_id is null for default categories
          category.name,
          category.type,
          category.icon,
          category.color,
          1, // is_default = true
          1,
          now,
          "SYNCED", // Default categories are pre-synced
        ],
      );
    }

    console.log(
      `[Seed] Successfully seeded ${DEFAULT_CATEGORIES.length} default categories`,
    );
  } catch (error) {
    console.error("[Seed] Error seeding default categories:", error);
    throw error;
  }
};

/**
 * Seed all initial data
 */
export const seedInitialData = async (
  database: SQLite.SQLiteDatabase,
): Promise<void> => {
  await seedDefaultCategories(database);
  // Add more seed functions here as needed
};
