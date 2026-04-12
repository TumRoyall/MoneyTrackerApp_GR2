export interface Category {
  categoryId: string;
  userId: string;
  name: string;
  type: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
}

export interface CategoryCreateInput {
  name: string;
  type: string;
  description?: string | null;
}

export interface CategoryUpdateInput {
  name?: string;
  type?: string;
  description?: string | null;
}
