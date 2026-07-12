import { Category } from '@/modules/category/models/category.types';
import { CreateCategoryInput } from '@/modules/category/api/categoryRemoteDataSource';

export interface CategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategory(categoryId: string): Promise<Category | null>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
}
