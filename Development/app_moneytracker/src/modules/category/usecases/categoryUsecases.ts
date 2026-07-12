import { CategoryRepository } from '@/modules/category/repository/categoryRepository';
import { CreateCategoryInput } from '@/modules/category/api/categoryRemoteDataSource';

export const createCategoryUsecases = (repository: CategoryRepository) => ({
  getCategories: () => repository.getCategories(),
  getCategory: (categoryId: string) => repository.getCategory(categoryId),
  createCategory: (input: CreateCategoryInput) => repository.createCategory(input),
});