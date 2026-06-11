export interface Category {
  categoryId: string;
  groupId?: string;
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
