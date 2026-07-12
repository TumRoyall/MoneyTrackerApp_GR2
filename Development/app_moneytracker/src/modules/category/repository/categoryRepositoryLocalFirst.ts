import { Category } from '@/modules/category/models/category.types';
import { CategoryRepository } from '@/modules/category/repository/categoryRepository';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { CategoryRemoteDataSource, CreateCategoryInput } from '@/modules/category/api/categoryRemoteDataSource';
import { SyncService } from '@/modules/sync/service/syncService';

export class CategoryRepositoryLocalFirst implements CategoryRepository {
  constructor(
    private readonly local: CategoryLocalDataSource,
    private readonly remote: CategoryRemoteDataSource,
    private readonly syncService: SyncService,
  ) {}

  async getCategories(): Promise<Category[]> {
    await this.syncService.ensureInitialized();
    const localCategories = await this.local.getCategories();
    if (localCategories.length) {
      return localCategories;
    }

    // First-boot fallback: pull the system categories from the server seed.
    // After migration the local DB should always have the hardcoded
    // categories, so this branch is a safety net for installs that bypass
    // the migration (e.g. debug build that deletes the local DB).
    try {
      const remoteCategories = await this.remote.getCategories();
      await this.local.upsertMany(remoteCategories);
      return remoteCategories;
    } catch {
      return localCategories;
    }
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    await this.syncService.ensureInitialized();
    const localCategory = await this.local.getCategoryById(categoryId);
    if (localCategory) {
      return localCategory;
    }

    try {
      const remoteCategory = await this.remote.getCategory(categoryId);
      if (remoteCategory) {
        await this.local.upsert(remoteCategory);
      }
      return remoteCategory;
    } catch {
      return localCategory;
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    await this.syncService.ensureInitialized();
    // Create on server first
    const created = await this.remote.createCategory(input);
    // Save locally for offline access
    await this.local.upsert(created);
    return created;
  }
}
