export interface Category {
  categoryId: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | string;
  icon?: string | null;
  color?: string | null;
  isDefault?: boolean | null;
  isHidden?: boolean | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  version?: number | null;
}

export interface CategoryCreateInput {
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon?: string | null;
  color?: string | null;
}

export interface CategoryUpdateInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
}
