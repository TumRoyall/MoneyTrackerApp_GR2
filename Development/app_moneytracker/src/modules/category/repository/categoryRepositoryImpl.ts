import {
  CategoryCreateInput,
  CategoryUpdateInput,
} from '@/modules/category/models/category.types';
import { CategoryRemoteDataSource } from '@/modules/category/api/categoryRemoteDataSource';
import { CategoryRepository } from '@/modules/category/repository/categoryRepository';

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly remote: CategoryRemoteDataSource) {}

  async getCategories() {
    return this.remote.getCategories();
  }

  async getCategory(categoryId: string) {
    return this.remote.getCategory(categoryId);
  }

  async createCategory(payload: CategoryCreateInput) {
    return this.remote.createCategory(payload);
  }

  async updateCategory(categoryId: string, payload: CategoryUpdateInput) {
    return this.remote.updateCategory(categoryId, payload);
  }

  async deleteCategory(categoryId: string) {
    return this.remote.deleteCategory(categoryId);
  }
}