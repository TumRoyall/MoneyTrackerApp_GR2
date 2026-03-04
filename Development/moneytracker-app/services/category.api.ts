import api from "./axios";

export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  categoryId: number;
  name: string;
  icon: string; // can be emoji or an icon name
  color: string; // hex color
  type: CategoryType;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>("/api/categories");
  return res.data;
}

export async function getCategoryDetail(id: number): Promise<Category> {
  const res = await api.get<Category>(`/api/categories/${id}`);
  return res.data;
}
