import * as Crypto from 'expo-crypto';
import { Category, CategoryCreateInput, CategoryUpdateInput } from '@/modules/category/models/category.types';
import { CategoryRepository } from '@/modules/category/repository/categoryRepository';
import { CategoryLocalDataSource } from '@/modules/category/local/categoryLocalDataSource';
import { CategoryRemoteDataSource } from '@/modules/category/api/categoryRemoteDataSource';
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

  async createCategory(payload: CategoryCreateInput): Promise<Category> {
    await this.syncService.ensureInitialized();
    const now = new Date().toISOString();
    const category: Category = {
      categoryId: Crypto.randomUUID(),
      name: payload.name,
      type: payload.type,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
      isDefault: false,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    };

    await this.local.upsert(category);

    // Only sync user-created categories, not default categories
    // Default categories (isDefault=true) should be managed by the server
    if (!category.isDefault) {
      await this.syncService.enqueueOperation({
        requestId: Crypto.randomUUID(),
        entity: 'categories',
        entityId: category.categoryId,
        op: 'UPSERT',
        baseVersion: null,
        data: {
          categoryId: category.categoryId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault,
          isHidden: category.isHidden,
          createdAt: category.createdAt ? new Date(category.createdAt).getTime() : undefined,
          updatedAt: category.updatedAt ? new Date(category.updatedAt).getTime() : undefined,
        },
      });
      void this.syncService.syncInBackground();
    }

    return category;
  }

  async updateCategory(categoryId: string, payload: CategoryUpdateInput): Promise<Category> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getCategoryById(categoryId);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Prevent updating default categories
    if (existing.isDefault) {
      throw new Error('Default category cannot be updated');
    }

    const updated: Category = {
      ...existing,
      name: payload.name ?? existing.name,
      icon: payload.icon ?? existing.icon,
      color: payload.color ?? existing.color,
      updatedAt: new Date().toISOString(),
    };

    await this.local.upsert(updated);
    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'categories',
      entityId: categoryId,
      op: 'UPSERT',
      baseVersion: existing.version ?? 1,
      data: {
        categoryId: updated.categoryId,
        name: updated.name,
        type: updated.type,
        icon: updated.icon,
        color: updated.color,
        isDefault: updated.isDefault,
        isHidden: updated.isHidden,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();

    return updated;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.syncService.ensureInitialized();
    const existing = await this.local.getCategoryById(categoryId);
    if (!existing) {
      return;
    }

    // Prevent deleting default categories - only hide them locally
    if (existing.isDefault) {
      return;
    }

    const updated: Category = {
      ...existing,
      isHidden: true,
      updatedAt: new Date().toISOString(),
    };

    await this.local.upsert(updated);
    await this.syncService.enqueueOperation({
      requestId: Crypto.randomUUID(),
      entity: 'categories',
      entityId: categoryId,
      op: 'UPSERT',
      baseVersion: existing.version ?? 1,
      data: {
        categoryId: updated.categoryId,
        name: updated.name,
        type: updated.type,
        icon: updated.icon,
        color: updated.color,
        isDefault: updated.isDefault,
        isHidden: updated.isHidden,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).getTime() : undefined,
      },
    });

    void this.syncService.syncInBackground();
  }
}
