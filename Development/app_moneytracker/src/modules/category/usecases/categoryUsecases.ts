import {
  CategoryCreateInput,
  CategoryUpdateInput,
} from '@/modules/category/models/category.types';
import { CategoryRepository } from '@/modules/category/repository/categoryRepository';

export const createCategoryUsecases = (repository: CategoryRepository) => ({
  getCategories: () => repository.getCategories(),
  getCategory: (categoryId: string) => repository.getCategory(categoryId),
  createCategory: (payload: CategoryCreateInput) => repository.createCategory(payload),
  updateCategory: (categoryId: string, payload: CategoryUpdateInput) =>
    repository.updateCategory(categoryId, payload),
  deleteCategory: (categoryId: string) => repository.deleteCategory(categoryId),
});