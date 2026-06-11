import { CategoryRepository } from '@/modules/category/repository/categoryRepository';

export const createCategoryUsecases = (repository: CategoryRepository) => ({
  getCategories: () => repository.getCategories(),
  getCategory: (categoryId: string) => repository.getCategory(categoryId),
});