// Default categories data - 13 EXPENSE + 5 INCOME = 18 categories with colors

export interface DefaultCategory {
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
}

export const defaultCategories: DefaultCategory[] = [
  // EXPENSE - 13 categories
  { name: 'Thức ăn & Đồ uống', type: 'EXPENSE', icon: 'food-fork-drink', color: '#FF6B6B' },
  { name: 'Mua sắm', type: 'EXPENSE', icon: 'cart', color: '#4ECDC4' },
  { name: 'Du lịch', type: 'EXPENSE', icon: 'airplane', color: '#45B7D1' },
  { name: 'Sức khỏe', type: 'EXPENSE', icon: 'pill', color: '#FF8A80' },
  { name: 'Giải trí', type: 'EXPENSE', icon: 'movie', color: '#DDA0DD' },
  { name: 'Thú cưng', type: 'EXPENSE', icon: 'dog', color: '#FFD54F' },
  { name: 'Thực phẩm', type: 'EXPENSE', icon: 'food-apple', color: '#81C784' },
  { name: 'Điện tử', type: 'EXPENSE', icon: 'cellphone', color: '#90CAF9' },
  { name: 'Làm đẹp', type: 'EXPENSE', icon: 'lipstick', color: '#F48FB1' },
  { name: 'Thể thao', type: 'EXPENSE', icon: 'dumbbell', color: '#FF7043' },
  { name: 'Giáo dục', type: 'EXPENSE', icon: 'book', color: '#FFB74D' },
  { name: 'Giao thông', type: 'EXPENSE', icon: 'car', color: '#80DEEA' },
  { name: 'Nhà', type: 'EXPENSE', icon: 'home', color: '#A5D6A7' },

  // INCOME - 5 categories
  { name: 'Lương', type: 'INCOME', icon: 'briefcase', color: '#1565C0' },
  { name: 'Thưởng', type: 'INCOME', icon: 'trophy', color: '#FFD700' },
  { name: 'Đầu tư', type: 'INCOME', icon: 'chart-timeline-variant', color: '#00BCD4' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#9C27B0' },
  { name: 'Quà tặng', type: 'INCOME', icon: 'gift', color: '#E91E63' },
];

// Backward compatible export
export const categoryIconOptions = defaultCategories.map(c => ({
  label: c.name,
  icon: c.icon,
  color: c.color,
  type: c.type,
}));