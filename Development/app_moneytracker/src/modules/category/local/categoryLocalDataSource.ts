import { executeSql, queryAll, queryOne } from '@/core/db/sqlite';
import { Category } from '@/modules/category/models/category.types';

export class CategoryLocalDataSource {
  async getCategories(): Promise<Category[]> {
    return queryAll<Category>('SELECT * FROM categories WHERE deletedAt IS NULL ORDER BY createdAt DESC');
  }

  async getCategoryById(categoryId: string): Promise<Category | null> {
    return queryOne<Category>('SELECT * FROM categories WHERE categoryId = ?', [categoryId]);
  }

  async upsert(category: Category) {
    await executeSql(
      `INSERT OR REPLACE INTO categories
        (categoryId, name, type, icon, color, isDefault, isHidden, createdAt, updatedAt, deletedAt, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.categoryId,
        category.name,
        category.type,
        category.icon ?? null,
        category.color ?? null,
        category.isDefault ? 1 : 0,
        category.isHidden ? 1 : 0,
        category.createdAt,
        category.updatedAt ?? category.createdAt,
        category.deletedAt ?? null,
        category.version ?? 1,
      ],
    );
  }

  async upsertMany(categories: Category[]) {
    for (const category of categories) {
      await this.upsert(category);
    }
  }

  async markDeleted(categoryId: string, deletedAt: string) {
    await executeSql('UPDATE categories SET deletedAt = ?, updatedAt = ? WHERE categoryId = ?', [
      deletedAt,
      deletedAt,
      categoryId,
    ]);
  }
}
