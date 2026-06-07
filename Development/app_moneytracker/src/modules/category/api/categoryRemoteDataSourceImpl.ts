import { httpClient } from '@/core/api/httpClient';
import { ApiResponse } from '@/core/types/api.types';
import { Category } from '@/modules/category/models/category.types';
import { CategoryRemoteDataSource } from '@/modules/category/api/categoryRemoteDataSource';

export class CategoryRemoteDataSourceImpl implements CategoryRemoteDataSource {
  async getCategories(): Promise<Category[]> {
    const response = await httpClient.get<ApiResponse<Category[]>>('/api/categories');
    return response.data.data;
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    const response = await httpClient.get<ApiResponse<Category>>(`/api/categories/${categoryId}`);
    return response.data.data;
  }
}