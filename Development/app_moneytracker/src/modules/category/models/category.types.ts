export interface Category {
  categoryId: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | string;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
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
