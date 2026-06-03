// Category icon groups with sub-icons for user selection

export interface IconOption {
  icon: string;
  label: string;
  color: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  emoji: string;
  icon: string; // Default icon
  color: string;
  subIcons: IconOption[]; // Icons to show when user creates custom category
}

export const categoryGroups: CategoryGroup[] = [
  {
    id: 'food',
    name: 'Thức ăn & Đồ uống',
    emoji: '🍔',
    icon: 'food-fork-drink',
    color: '#FF6B6B',
    subIcons: [
      { icon: 'food-fork-drink', label: 'Đồ ăn', color: '#FF6B6B' },
      { icon: 'coffee', label: 'Cà phê', color: '#8B4513' },
      { icon: 'cup', label: 'Đồ uống', color: '#87CEEB' },
      { icon: 'silverware-fork-knife', label: 'Nhà hàng', color: '#DDA0DD' },
      { icon: 'cookie', label: 'Bánh ngọt', color: '#DEB887' },
      { icon: 'food-takeout-box', label: 'Mang đi', color: '#F4A460' },
      { icon: 'pizza', label: 'Pizza', color: '#FF4500' },
      { icon: 'noodles', label: 'Mì', color: '#FFD700' },
      { icon: 'hamburger', label: 'Hamburger', color: '#FFA500' },
      { icon: 'ice-cream', label: 'Kem', color: '#FFC0CB' },
      { icon: 'fruit-cherries', label: 'Trái cây', color: '#DC143C' },
      { icon: 'bowl-mix', label: 'Salad', color: '#90EE90' },
    ],
  },
  {
    id: 'shopping',
    name: 'Mua sắm',
    emoji: '🛒',
    icon: 'cart',
    color: '#4ECDC4',
    subIcons: [
      { icon: 'cart', label: 'Siêu thị', color: '#4ECDC4' },
      { icon: 'shopping', label: 'Mua sắm', color: '#FF69B4' },
      { icon: 'tshirt-crew', label: 'Quần áo', color: '#9370DB' },
      { icon: 'shoe-sneaker', label: 'Giày dép', color: '#708090' },
      { icon: 'bag-personal', label: 'Túi xách', color: '#D2691E' },
      { icon: 'watch', label: 'Đồng hồ', color: '#FFD700' },
      { icon: 'diamond-stone', label: 'Trang sức', color: '#E6E6FA' },
      { icon: 'hanger', label: 'Thời trang', color: '#DDA0DD' },
      { icon: 'shopping-outline', label: 'Online', color: '#FF6B6B' },
      { icon: 'store', label: 'Cửa hàng', color: '#4CAF50' },
    ],
  },
  {
    id: 'travel',
    name: 'Du lịch',
    emoji: '✈️',
    icon: 'airplane',
    color: '#45B7D1',
    subIcons: [
      { icon: 'airplane', label: 'Máy bay', color: '#45B7D1' },
      { icon: 'beach', label: 'Biển', color: '#00CED1' },
      { icon: 'passport', label: 'Passport', color: '#4169E1' },
      { icon: 'hiking', label: 'Leo núi', color: '#228B22' },
      { icon: 'camp', label: 'Cắm trại', color: '#8B4513' },
      { icon: 'umbrella', label: 'Nghỉ mát', color: '#FF6B6B' },
      { icon: 'map-marker', label: 'Địa điểm', color: '#FF4500' },
      { icon: 'bus', label: 'Tour', color: '#4CAF50' },
    ],
  },
  {
    id: 'health',
    name: 'Sức khỏe',
    emoji: '💊',
    icon: 'pill',
    color: '#FF8A80',
    subIcons: [
      { icon: 'pill', label: 'Thuốc', color: '#FF8A80' },
      { icon: 'hospital-box', label: 'Bệnh viện', color: '#FF0000' },
      { icon: 'stethoscope', label: 'Khám bệnh', color: '#E0FFFF' },
      { icon: 'needle', label: 'Tiêm', color: '#FFC0CB' },
      { icon: 'medical-bag', label: 'Y tế', color: '#F0F8FF' },
      { icon: 'heart-pulse', label: 'Tim mạch', color: '#FF1493' },
      { icon: 'brain', label: 'Thần kinh', color: '#9370DB' },
      { icon: 'eye', label: 'Mắt', color: '#4169E1' },
      { icon: 'tooth', label: 'Răng', color: '#FFFACD' },
      { icon: 'shield-check', label: 'Bảo hiểm', color: '#4169E1' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Giải trí',
    emoji: '🎮',
    icon: 'movie',
    color: '#DDA0DD',
    subIcons: [
      { icon: 'movie', label: 'Phim', color: '#DDA0DD' },
      { icon: 'gamepad-variant', label: 'Game', color: '#4B0082' },
      { icon: 'music', label: 'Nhạc', color: '#9370DB' },
      { icon: 'microphone', label: 'Karaoke', color: '#FF1493' },
      { icon: 'youtube', label: 'YouTube', color: '#FF0000' },
      { icon: 'netflix', label: 'Streaming', color: '#E50914' },
      { icon: 'gamepad', label: 'Console', color: '#2F4F4F' },
      { icon: 'puzzle', label: 'Cờ', color: '#FFD700' },
      { icon: 'spa', label: 'Spa', color: '#FF69B4' },
    ],
  },
  {
    id: 'pet',
    name: 'Thú cưng',
    emoji: '🐕',
    icon: 'dog',
    color: '#FFD54F',
    subIcons: [
      { icon: 'dog', label: 'Chó', color: '#D2691E' },
      { icon: 'cat', label: 'Mèo', color: '#808080' },
      { icon: 'fish', label: 'Cá', color: '#00CED1' },
      { icon: 'bird', label: 'Chim', color: '#87CEEB' },
      { icon: 'food-drumstick', label: 'Thức ăn pet', color: '#CD853F' },
      { icon: 'doctor', label: 'Thú y', color: '#FFFFFF' },
      { icon: 'toy-brick', label: 'Đồ chơi', color: '#FF69B4' },
      { icon: 'bed', label: 'Pet bed', color: '#DEB887' },
      { icon: 'shower', label: 'Tắm pet', color: '#87CEEB' },
    ],
  },
  {
    id: 'grocery',
    name: 'Thực phẩm',
    emoji: '🥗',
    icon: 'food-apple',
    color: '#81C784',
    subIcons: [
      { icon: 'food-apple', label: 'Rau củ', color: '#81C784' },
      { icon: 'egg', label: 'Trứng', color: '#FFF8DC' },
      { icon: 'cheese', label: 'Sữa', color: '#FFFACD' },
      { icon: 'food-drumstick', label: 'Thịt', color: '#CD853F' },
      { icon: 'fish', label: 'Cá', color: '#87CEEB' },
      { icon: 'rice', label: 'Gạo', color: '#FFF8DC' },
      { icon: 'peanut', label: 'Hạt', color: '#DEB887' },
      { icon: 'leaf', label: 'Rau xanh', color: '#228B22' },
      { icon: 'water', label: 'Nước', color: '#00BFFF' },
    ],
  },
  {
    id: 'electronics',
    name: 'Điện tử',
    emoji: '📱',
    icon: 'cellphone',
    color: '#90CAF9',
    subIcons: [
      { icon: 'cellphone', label: 'Điện thoại', color: '#90CAF9' },
      { icon: 'laptop', label: 'Laptop', color: '#708090' },
      { icon: 'tablet', label: 'Tablet', color: '#4169E1' },
      { icon: 'headphones', label: 'Tai nghe', color: '#2F4F4F' },
      { icon: 'watch', label: ' smartwatch', color: '#FFD700' },
      { icon: 'speaker', label: 'Loa', color: '#FF6B6B' },
      { icon: 'camera', label: 'Camera', color: '#708090' },
      { icon: 'gamepad', label: 'Gaming', color: '#9370DB' },
      { icon: 'usb', label: 'Phụ kiện', color: '#4ECDC4' },
    ],
  },
  {
    id: 'beauty',
    name: 'Làm đẹp',
    emoji: '💄',
    icon: 'lipstick',
    color: '#F48FB1',
    subIcons: [
      { icon: 'lipstick', label: 'Son', color: '#F48FB1' },
      { icon: 'palette', label: 'Trang điểm', color: '#FF69B4' },
      { icon: 'face-woman-shimmer', label: 'Skincare', color: '#FFC0CB' },
      { icon: 'hair-dryer', label: 'Làm tóc', color: '#DEB887' },
      { icon: 'nail', label: 'Nail', color: '#FF1493' },
      { icon: 'spa', label: 'Spa', color: '#F8BBD9' },
      { icon: 'massage', label: 'Massage', color: '#E1BEE7' },
      { icon: 'flower', label: 'Nước hoa', color: '#DDA0DD' },
    ],
  },
  {
    id: 'sports',
    name: 'Thể thao',
    emoji: '⚽',
    icon: 'dumbbell',
    color: '#FF7043',
    subIcons: [
      { icon: 'dumbbell', label: 'Gym', color: '#FF7043' },
      { icon: 'football', label: 'Bóng đá', color: '#4CAF50' },
      { icon: 'basketball', label: 'Bóng rổ', color: '#FF9800' },
      { icon: 'tennis', label: 'Tennis', color: '#FFEB3B' },
      { icon: 'swim', label: 'Bơi lội', color: '#00BCD4' },
      { icon: 'run', label: 'Chạy bộ', color: '#F44336' },
      { icon: 'yoga', label: 'Yoga', color: '#9C27B0' },
      { icon: 'bike', label: 'Xe đạp', color: '#795548' },
      { icon: 'hiking', label: 'Leo núi', color: '#4CAF50' },
    ],
  },
  {
    id: 'education',
    name: 'Giáo dục',
    emoji: '📚',
    icon: 'book',
    color: '#FFB74D',
    subIcons: [
      { icon: 'book', label: 'Sách', color: '#8B4513' },
      { icon: 'school', label: 'Học phí', color: '#4169E1' },
      { icon: 'certificate', label: 'Chứng chỉ', color: '#FFD700' },
      { icon: 'pencil', label: 'Dụng cụ học', color: '#FF69B4' },
      { icon: 'pen', label: 'Văn phòng phẩm', color: '#4169E1' },
      { icon: 'laptop', label: 'Học online', color: '#708090' },
      { icon: 'brain', label: 'Khóa học', color: '#9370DB' },
      { icon: 'trophy', label: 'Thành tích', color: '#FFD700' },
    ],
  },
  {
    id: 'transport',
    name: 'Giao thông',
    emoji: '🚗',
    icon: 'car',
    color: '#80DEEA',
    subIcons: [
      { icon: 'gas-station', label: 'Xăng', color: '#FF4500' },
      { icon: 'car', label: 'Ô tô', color: '#4682B4' },
      { icon: 'motorbike', label: 'Xe máy', color: '#2F4F4F' },
      { icon: 'taxi', label: 'Taxi', color: '#FFD700' },
      { icon: 'bus', label: 'Bus', color: '#32CD32' },
      { icon: 'train', label: 'Tàu lửa', color: '#8B0000' },
      { icon: 'airplane', label: 'Máy bay', color: '#87CEEB' },
      { icon: 'parking', label: 'Parking', color: '#708090' },
      { icon: 'car-wrench', label: 'Bảo dưỡng', color: '#DAA520' },
      { icon: 'bicycle', label: 'Xe đạp', color: '#006400' },
    ],
  },
  {
    id: 'home',
    name: 'Nhà',
    emoji: '🏠',
    icon: 'home',
    color: '#A5D6A7',
    subIcons: [
      { icon: 'home', label: 'Nhà', color: '#A5D6A7' },
      { icon: 'key-variant', label: 'Thuê nhà', color: '#4169E1' },
      { icon: 'flash', label: 'Điện', color: '#FFD700' },
      { icon: 'water', label: 'Nước', color: '#00CED1' },
      { icon: 'gas-cylinder', label: 'Gas', color: '#FF8C00' },
      { icon: 'wifi', label: 'Internet', color: '#00BFFF' },
      { icon: 'wrench', label: 'Sửa chữa', color: '#808080' },
      { icon: 'sofa', label: 'Nội thất', color: '#8B4513' },
      { icon: 'broom', label: 'Dọn dẹp', color: '#BC8F8F' },
      { icon: 'lamp', label: 'Điện', color: '#FFFACD' },
    ],
  },
  {
    id: 'income',
    name: 'Thu nhập',
    emoji: '💰',
    icon: 'cash',
    color: '#4CAF50',
    subIcons: [
      { icon: 'briefcase', label: 'Lương', color: '#1565C0' },
      { icon: 'trophy', label: 'Thưởng', color: '#FFD700' },
      { icon: 'cash-plus', label: 'Phụ cấp', color: '#2196F3' },
      { icon: 'account-cash', label: 'Hoa hồng', color: '#4CAF50' },
      { icon: 'chart-timeline-variant', label: 'Đầu tư', color: '#00BCD4' },
      { icon: 'piggy-bank', label: 'Tiết kiệm', color: '#FF9800' },
      { icon: 'store', label: 'Kinh doanh', color: '#8BC34A' },
      { icon: 'laptop', label: 'Freelance', color: '#9C27B0' },
      { icon: 'gift', label: 'Quà tặng', color: '#E91E63' },
      { icon: 'cash', label: 'Khác', color: '#607D8B' },
    ],
  },
];

// Get expense groups (exclude income)
export const expenseGroups = categoryGroups.filter(g => g.id !== 'income');

// Get income groups - each group is a specific income type
export const incomeGroups = [
  {
    id: 'salary',
    name: 'Lương',
    emoji: '💵',
    icon: 'briefcase',
    color: '#1565C0',
    subIcons: categoryGroups.find(g => g.id === 'income')?.subIcons.filter(i =>
      ['briefcase', 'cash-plus', 'account-cash'].includes(i.icon)
    ) || [],
  },
  {
    id: 'bonus',
    name: 'Thưởng',
    emoji: '🏆',
    icon: 'trophy',
    color: '#FFD700',
    subIcons: categoryGroups.find(g => g.id === 'income')?.subIcons.filter(i =>
      ['trophy', 'medal'].includes(i.icon)
    ) || [],
  },
  {
    id: 'investment',
    name: 'Đầu tư',
    emoji: '📈',
    icon: 'chart-timeline-variant',
    color: '#00BCD4',
    subIcons: categoryGroups.find(g => g.id === 'income')?.subIcons.filter(i =>
      ['chart-timeline-variant', 'piggy-bank', 'percent', 'bitcoin', 'home-estate'].includes(i.icon)
    ) || [],
  },
  {
    id: 'freelance',
    name: 'Freelance',
    emoji: '💻',
    icon: 'laptop',
    color: '#9C27B0',
    subIcons: categoryGroups.find(g => g.id === 'income')?.subIcons.filter(i =>
      ['laptop', 'store', 'account-wrench'].includes(i.icon)
    ) || [],
  },
  {
    id: 'gift',
    name: 'Quà tặng',
    emoji: '🎁',
    icon: 'gift',
    color: '#E91E63',
    subIcons: categoryGroups.find(g => g.id === 'income')?.subIcons.filter(i =>
      ['gift', 'cash-refund', 'tag-sell'].includes(i.icon)
    ) || [],
  },
];

// Default categories for seeding (13 EXPENSE + 5 INCOME = 18 total)
export const defaultCategories: { name: string; type: 'EXPENSE' | 'INCOME'; icon: string; color: string }[] = [
  // 13 EXPENSE categories
  ...categoryGroups.filter(g => g.id !== 'income').map(group => ({
    name: group.name,
    type: 'EXPENSE' as const,
    icon: group.icon,
    color: group.color,
  })),
  // 5 INCOME categories
  { name: 'Lương', type: 'INCOME', icon: 'briefcase', color: '#1565C0' },
  { name: 'Thưởng', type: 'INCOME', icon: 'trophy', color: '#FFD700' },
  { name: 'Đầu tư', type: 'INCOME', icon: 'chart-timeline-variant', color: '#00BCD4' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#9C27B0' },
  { name: 'Quà tặng', type: 'INCOME', icon: 'gift', color: '#E91E63' },
];