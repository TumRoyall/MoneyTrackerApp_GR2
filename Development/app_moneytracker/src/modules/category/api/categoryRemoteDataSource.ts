import { Category } from '@/modules/category/models/category.types';

export interface CategoryRemoteDataSource {
  getCategories(): Promise<Category[]>;
  getCategory(categoryId: string): Promise<Category | null>;
}
