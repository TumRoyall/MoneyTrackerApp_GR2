import { Category } from '@/modules/category/models/category.types';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface CategoryRemoteDataSource {
  getCategories(): Promise<Category[]>;
  getCategory(categoryId: string): Promise<Category | null>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
}
