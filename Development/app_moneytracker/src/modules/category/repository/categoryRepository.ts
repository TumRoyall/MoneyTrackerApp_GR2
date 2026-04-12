import {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from '@/modules/category/models/category.types';

export interface CategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategory(categoryId: string): Promise<Category | null>;
  createCategory(payload: CategoryCreateInput): Promise<Category>;
  updateCategory(categoryId: string, payload: CategoryUpdateInput): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
}
