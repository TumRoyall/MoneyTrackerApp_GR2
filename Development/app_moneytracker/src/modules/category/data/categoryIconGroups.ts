// Category icon groups with sub-icons for user selection
// MUST be kept in sync with CategoryGroups.java (backend)

export interface IconOption {
  icon: string;
  label: string;
  color: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  emoji: string;
  icon: string; // Default icon (Lucide PascalCase)
  color: string;
  subIcons: IconOption[]; // Icons to show when user selects from this group
  expandable: boolean; // Can user add more categories to this group
}

// NAMESPACE must match CategoryGroups.NAMESPACE in backend
export const CATEGORY_NAMESPACE = 'moneytracker-default-category-v3';

export const categoryGroups: CategoryGroup[] = [
  // --- EXPENSE GROUPS ---
  {
    id: 'uncategorized',
    name: 'Chưa phân loại',
    type: 'EXPENSE',
    emoji: '❓',
    icon: 'HelpCircle',
    color: '#9CA3AF',
    expandable: false,
    subIcons: [
      { icon: 'HelpCircle', label: 'Chưa phân loại', color: '#9CA3AF' },
    ],
  },
  {
    id: 'food',
    name: 'Thức ăn & Đồ uống',
    type: 'EXPENSE',
    emoji: '🍔',
    icon: 'UtensilsCrossed',
    color: '#F59E0B',
    expandable: true,
    subIcons: [
      { icon: 'UtensilsCrossed', label: 'Thức ăn', color: '#F59E0B' },
      { icon: 'Cup', label: 'Đồ uống', color: '#87CEEB' },
      { icon: 'Coffee', label: 'Cà phê', color: '#8B4513' },
      { icon: 'Pizza', label: 'Pizza', color: '#FF4500' },
      { icon: 'Cake', label: 'Bánh ngọt', color: '#DEB887' },
      { icon: 'IceCream', label: 'Kem', color: '#FFC0CB' },
      { icon: 'Apple', label: 'Trái cây', color: '#DC143C' },
      { icon: 'Salad', label: 'Salad', color: '#90EE90' },
    ],
  },
  {
    id: 'shopping',
    name: 'Mua sắm',
    type: 'EXPENSE',
    emoji: '👕',
    icon: 'ShoppingBag',
    color: '#EC4899',
    expandable: true,
    subIcons: [
      { icon: 'ShoppingBag', label: 'Mua sắm', color: '#EC4899' },
      { icon: 'Shirt', label: 'Quần áo', color: '#9370DB' },
      { icon: 'Footprints', label: 'Giày dép', color: '#708090' },
      { icon: 'Watch', label: 'Đồng hồ', color: '#FFD700' },
      { icon: 'Gem', label: 'Trang sức', color: '#E6E6FA' },
      { icon: 'ShoppingCart', label: 'Siêu thị', color: '#4ECDC4' },
      { icon: 'Store', label: 'Cửa hàng', color: '#4CAF50' },
    ],
  },
  {
    id: 'travel',
    name: 'Du lịch',
    type: 'EXPENSE',
    emoji: '✈️',
    icon: 'Plane',
    color: '#3B82F6',
    expandable: true,
    subIcons: [
      { icon: 'Plane', label: 'Máy bay', color: '#3B82F6' },
      { icon: 'Hotel', label: 'Khách sạn', color: '#45B7D1' },
      { icon: 'Tent', label: 'Cắm trại', color: '#228B22' },
      { icon: 'MapPin', label: 'Địa điểm', color: '#FF4500' },
      { icon: 'Bus', label: 'Bus/Tour', color: '#4CAF50' },
      { icon: 'Umbrella', label: 'Nghỉ mát', color: '#FF6B6B' },
    ],
  },
  {
    id: 'health',
    name: 'Sức khỏe',
    type: 'EXPENSE',
    emoji: '💊',
    icon: 'Pill',
    color: '#EF4444',
    expandable: true,
    subIcons: [
      { icon: 'Pill', label: 'Thuốc', color: '#EF4444' },
      { icon: 'Stethoscope', label: 'Khám bệnh', color: '#E0FFFF' },
      { icon: 'Syringe', label: 'Tiêm', color: '#FFC0CB' },
      { icon: 'Heart', label: 'Tim mạch', color: '#FF1493' },
      { icon: 'Eye', label: 'Mắt', color: '#4169E1' },
      { icon: 'Tooth', label: 'Răng', color: '#FFFACD' },
      { icon: 'Shield', label: 'Bảo hiểm', color: '#4169E1' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Giải trí',
    type: 'EXPENSE',
    emoji: '🎮',
    icon: 'Gamepad2',
    color: '#8B5CF6',
    expandable: true,
    subIcons: [
      { icon: 'Gamepad2', label: 'Game', color: '#8B5CF6' },
      { icon: 'Film', label: 'Phim', color: '#DDA0DD' },
      { icon: 'Music', label: 'Nhạc', color: '#9370DB' },
      { icon: 'Mic', label: 'Karaoke', color: '#FF1493' },
      { icon: 'Tv', label: 'Streaming', color: '#E50914' },
      { icon: 'Clapperboard', label: 'YouTube', color: '#FF0000' },
    ],
  },
  {
    id: 'pet',
    name: 'Thú cưng',
    type: 'EXPENSE',
    emoji: '🐾',
    icon: 'PawPrint',
    color: '#F97316',
    expandable: true,
    subIcons: [
      { icon: 'PawPrint', label: 'Thú cưng', color: '#F97316' },
      { icon: 'Dog', label: 'Chó', color: '#D2691E' },
      { icon: 'Cat', label: 'Mèo', color: '#808080' },
      { icon: 'Fish', label: 'Cá', color: '#00CED1' },
      { icon: 'Bird', label: 'Chim', color: '#87CEEB' },
    ],
  },
  {
    id: 'grocery',
    name: 'Thực phẩm',
    type: 'EXPENSE',
    emoji: '🛒',
    icon: 'ShoppingCart',
    color: '#22C55E',
    expandable: true,
    subIcons: [
      { icon: 'ShoppingCart', label: 'Siêu thị', color: '#22C55E' },
      { icon: 'Apple', label: 'Rau củ', color: '#81C784' },
      { icon: 'Milk', label: 'Sữa', color: '#FFFACD' },
      { icon: 'Drumstick', label: 'Thịt', color: '#CD853F' },
      { icon: 'Fish', label: 'Cá', color: '#87CEEB' },
      { icon: 'Wheat', label: 'Gạo', color: '#FFF8DC' },
      { icon: 'Droplets', label: 'Nước', color: '#00BFFF' },
    ],
  },
  {
    id: 'electronics',
    name: 'Điện tử',
    type: 'EXPENSE',
    emoji: '📱',
    icon: 'Smartphone',
    color: '#06B6D4',
    expandable: true,
    subIcons: [
      { icon: 'Smartphone', label: 'Điện thoại', color: '#06B6D4' },
      { icon: 'Laptop', label: 'Laptop', color: '#708090' },
      { icon: 'Tablet', label: 'Tablet', color: '#4169E1' },
      { icon: 'Headphones', label: 'Tai nghe', color: '#2F4F4F' },
      { icon: 'Speaker', label: 'Loa', color: '#FF6B6B' },
      { icon: 'Camera', label: 'Camera', color: '#708090' },
      { icon: 'Tv', label: 'TV', color: '#4169E1' },
    ],
  },
  {
    id: 'beauty',
    name: 'Làm đẹp',
    type: 'EXPENSE',
    emoji: '💄',
    icon: 'Sparkles',
    color: '#EC4899',
    expandable: true,
    subIcons: [
      { icon: 'Sparkles', label: 'Làm đẹp', color: '#EC4899' },
      { icon: 'Lipstick', label: 'Son', color: '#F48FB1' },
      { icon: 'Palette', label: 'Trang điểm', color: '#FF69B4' },
      { icon: 'Crown', label: 'Skincare', color: '#FFC0CB' },
      { icon: 'Scissors', label: 'Làm tóc', color: '#DEB887' },
      { icon: 'Flower', label: 'Nước hoa', color: '#DDA0DD' },
    ],
  },
  {
    id: 'sports',
    name: 'Thể thao',
    type: 'EXPENSE',
    emoji: '⚽',
    icon: 'Dumbbell',
    color: '#F59E0B',
    expandable: true,
    subIcons: [
      { icon: 'Dumbbell', label: 'Gym', color: '#F59E0B' },
      { icon: 'Soccer', label: 'Bóng đá', color: '#4CAF50' },
      { icon: 'Basketball', label: 'Bóng rổ', color: '#FF9800' },
      { icon: 'Swimming', label: 'Bơi lội', color: '#00BCD4' },
      { icon: 'Footprints', label: 'Chạy bộ', color: '#F44336' },
      { icon: 'Bike', label: 'Xe đạp', color: '#795548' },
    ],
  },
  {
    id: 'education',
    name: 'Giáo dục',
    type: 'EXPENSE',
    emoji: '🎓',
    icon: 'GraduationCap',
    color: '#6366F1',
    expandable: true,
    subIcons: [
      { icon: 'GraduationCap', label: 'Giáo dục', color: '#6366F1' },
      { icon: 'Book', label: 'Sách', color: '#8B4513' },
      { icon: 'Award', label: 'Chứng chỉ', color: '#FFD700' },
      { icon: 'Pencil', label: 'Dụng cụ học', color: '#FF69B4' },
      { icon: 'Brain', label: 'Khóa học', color: '#9370DB' },
    ],
  },
  {
    id: 'transport',
    name: 'Giao thông',
    type: 'EXPENSE',
    emoji: '🚕',
    icon: 'Car',
    color: '#64748B',
    expandable: true,
    subIcons: [
      { icon: 'Car', label: 'Ô tô', color: '#64748B' },
      { icon: 'Taxi', label: 'Taxi', color: '#FFD700' },
      { icon: 'Bus', label: 'Bus', color: '#32CD32' },
      { icon: 'Train', label: 'Tàu lửa', color: '#8B0000' },
      { icon: 'Plane', label: 'Máy bay', color: '#87CEEB' },
      { icon: 'Fuel', label: 'Xăng', color: '#FF4500' },
      { icon: 'Wrench', label: 'Bảo dưỡng', color: '#DAA520' },
      { icon: 'Bike', label: 'Xe máy', color: '#2F4F4F' },
    ],
  },
  {
    id: 'home',
    name: 'Nhà',
    type: 'EXPENSE',
    emoji: '🏠',
    icon: 'Home',
    color: '#10B981',
    expandable: true,
    subIcons: [
      { icon: 'Home', label: 'Nhà', color: '#10B981' },
      { icon: 'Key', label: 'Thuê nhà', color: '#4169E1' },
      { icon: 'Zap', label: 'Điện', color: '#FFD700' },
      { icon: 'Droplets', label: 'Nước', color: '#00CED1' },
      { icon: 'Flame', label: 'Gas', color: '#FF8C00' },
      { icon: 'Wifi', label: 'Internet', color: '#00BFFF' },
      { icon: 'Wrench', label: 'Sửa chữa', color: '#808080' },
      { icon: 'Sofa', label: 'Nội thất', color: '#8B4513' },
    ],
  },
  {
    id: 'debt',
    name: 'Nợ',
    type: 'EXPENSE',
    emoji: '💳',
    icon: 'CreditCard',
    color: '#EF4444',
    expandable: false, // Required for debt feature
    subIcons: [
      { icon: 'CreditCard', label: 'Nợ', color: '#EF4444' },
      { icon: 'Banknote', label: 'Trả nợ', color: '#F59E0B' },
    ],
  },
  {
    id: 'savings',
    name: 'Tiết kiệm',
    type: 'EXPENSE',
    emoji: '🐖',
    icon: 'PiggyBank',
    color: '#F59E0B',
    expandable: false, // Required for savings feature
    subIcons: [
      { icon: 'PiggyBank', label: 'Tiết kiệm', color: '#F59E0B' },
      { icon: 'Landmark', label: 'Ngân hàng', color: '#1976D2' },
      { icon: 'Coins', label: 'Tiền xu', color: '#FFC107' },
    ],
  },

  // --- INCOME GROUPS ---
  {
    id: 'uncategorized_income',
    name: 'Chưa được phân loại',
    type: 'INCOME',
    emoji: '❓',
    icon: 'HelpCircle',
    color: '#9CA3AF',
    expandable: false,
    subIcons: [
      { icon: 'HelpCircle', label: 'Chưa phân loại', color: '#9CA3AF' },
    ],
  },
  {
    id: 'salary',
    name: 'Lương',
    type: 'INCOME',
    emoji: '💼',
    icon: 'Briefcase',
    color: '#1565C0',
    expandable: true,
    subIcons: [
      { icon: 'Briefcase', label: 'Lương', color: '#1565C0' },
      { icon: 'Banknote', label: 'Tiền mặt', color: '#4CAF50' },
      { icon: 'Landmark', label: 'Chuyển khoản', color: '#1976D2' },
      { icon: 'Wallet', label: 'Ví', color: '#22C55E' },
    ],
  },
  {
    id: 'investment',
    name: 'Đầu tư',
    type: 'INCOME',
    emoji: '📈',
    icon: 'TrendingUp',
    color: '#00BCD4',
    expandable: true,
    subIcons: [
      { icon: 'TrendingUp', label: 'Đầu tư', color: '#00BCD4' },
      { icon: 'LineChart', label: 'Cổ phiếu', color: '#673AB7' },
      { icon: 'Building', label: 'Bất động sản', color: '#FF9800' },
      { icon: 'Coins', label: 'Cổ tức', color: '#FFC107' },
      { icon: 'PiggyBank', label: 'Lãi tiết kiệm', color: '#F59E0B' },
    ],
  },
  {
    id: 'bonus',
    name: 'Tiền thưởng',
    type: 'INCOME',
    emoji: '🏆',
    icon: 'Trophy',
    color: '#FFD700',
    expandable: true,
    subIcons: [
      { icon: 'Trophy', label: 'Thưởng', color: '#FFD700' },
      { icon: 'Gift', label: 'Quà tặng', color: '#E91E63' },
      { icon: 'Sparkles', label: 'Lì xì', color: '#F44336' },
      { icon: 'Star', label: 'Phần thưởng', color: '#FFEB3B' },
    ],
  },
  {
    id: 'business',
    name: 'Kinh doanh',
    type: 'INCOME',
    emoji: '🏪',
    icon: 'Store',
    color: '#8BC34A',
    expandable: true,
    subIcons: [
      { icon: 'Store', label: 'Cửa hàng', color: '#8BC34A' },
      { icon: 'ShoppingCart', label: 'Bán hàng', color: '#4ECDC4' },
      { icon: 'Truck', label: 'Vận chuyển', color: '#795548' },
      { icon: 'Laptop', label: 'Dịch vụ', color: '#9C27B0' },
    ],
  },
];

// Get expense groups
export const expenseGroups = categoryGroups.filter(g => g.type === 'EXPENSE');

// Get income groups
export const incomeGroups = categoryGroups.filter(g => g.type === 'INCOME');

