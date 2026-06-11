import { Category } from '@/modules/category/models/category.types';

export interface CategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategory(categoryId: string): Promise<Category | null>;
}
