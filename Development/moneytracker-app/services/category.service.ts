/**
 * Category Service - Local Database
 * Replaces backend API calls for category management
 */

import * as CategoryDAO from "@/dao/CategoryDAO";

export type CategoryType = CategoryDAO.CategoryType;
export type Category = CategoryDAO.Category;
export type CreateCategoryPayload = CategoryDAO.CreateCategoryPayload;

/* ===================== SERVICE FUNCTIONS ===================== */

/**
 * Get all categories (default + user categories)
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    console.log("[CategoryService] Fetching categories for user:", userId);
    const categories = await CategoryDAO.getCategories(userId);
    console.log("[CategoryService] Retrieved", categories.length, "categories");
    return categories;
  } catch (error) {
    console.error("[CategoryService] Error fetching categories:", error);
    throw error;
  }
};

/**
 * Get categories by type
 */
export const getCategoriesByType = async (
  userId: string,
  type: CategoryType,
): Promise<Category[]> => {
  try {
    console.log(
      "[CategoryService] Fetching",
      type,
      "categories for user:",
      userId,
    );
    const categories = await CategoryDAO.getCategoriesByType(userId, type);
    return categories;
  } catch (error) {
    console.error(
      "[CategoryService] Error fetching categories by type:",
      error,
    );
    throw error;
  }
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const category = await CategoryDAO.getCategoryById(id);
    return category;
  } catch (error) {
    console.error("[CategoryService] Error fetching category:", error);
    throw error;
  }
};

/**
 * Create new category
 */
export const createCategory = async (
  userId: string,
  payload: CreateCategoryPayload,
): Promise<Category> => {
  try {
    console.log("[CategoryService] Creating category:", payload.name);
    const category = await CategoryDAO.createCategory(userId, payload);
    console.log(
      "[CategoryService] Category created with ID:",
      category.category_id,
    );
    return category;
  } catch (error) {
    console.error("[CategoryService] Error creating category:", error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (
  id: string,
  payload: Partial<CreateCategoryPayload>,
): Promise<Category> => {
  try {
    console.log("[CategoryService] Updating category:", id);
    const category = await CategoryDAO.updateCategory(id, payload);
    console.log("[CategoryService] Category updated");
    return category;
  } catch (error) {
    console.error("[CategoryService] Error updating category:", error);
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    console.log("[CategoryService] Deleting category:", id);
    await CategoryDAO.deleteCategory(id);
    console.log("[CategoryService] Category deleted");
  } catch (error) {
    console.error("[CategoryService] Error deleting category:", error);
    throw error;
  }
};

/**
 * Initialize default categories
 */
export const initializeDefaultCategories = async (
  userId: string,
): Promise<void> => {
  try {
    console.log("[CategoryService] Initializing default categories");
    await CategoryDAO.initializeDefaultCategories(userId);
    console.log("[CategoryService] Default categories initialized");
  } catch (error) {
    console.error(
      "[CategoryService] Error initializing default categories:",
      error,
    );
    throw error;
  }
};
