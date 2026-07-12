package com.examples.moneytracker.category.seed;

import java.util.List;

/**
 * Mirror of app_moneytracker/src/modules/category/data/categoryIconGroups.ts.
 *
 * Server-side source-of-truth for system categories that ship with the app.
 * Each subIcon becomes one Category row (userId=NULL, isDefault=true). The
 * client (app_moneytracker) seeds the same rows locally via migration v4 —
 * both sides generate the same UUID from (groupId, icon) using UUIDv5-style
 * hashing, so transaction.categoryId resolves on both ends.
 *
 * KEEP IN SYNC with categoryIconGroups.ts. If a subIcon is added/removed
 * there, update it here too and reset the local DB to re-seed.
 *
 * Icon names follow lucide-react-native convention (PascalCase).
 */
public final class CategoryGroups {

    public static final String NAMESPACE = "moneytracker-default-category-v3";

    public record SubIcon(String icon, String label, String color) {}

    public record Group(String id, String name, String type, String icon, String color, List<SubIcon> subIcons) {}

    private CategoryGroups() {}

    public static List<Group> all() {
        return List.of(
            // Uncategorized - required fallback
            new Group("uncategorized", "Chưa phân loại", "EXPENSE", "HelpCircle", "#9CA3AF", List.of(
                new SubIcon("HelpCircle", "Chưa phân loại", "#9CA3AF")
            )),

            // Food & Drinks - expandable
            new Group("food", "Thức ăn & Đồ uống", "EXPENSE", "UtensilsCrossed", "#F59E0B", List.of(
                new SubIcon("UtensilsCrossed", "Thức ăn", "#F59E0B"),
                new SubIcon("Cup", "Đồ uống", "#87CEEB"),
                new SubIcon("Coffee", "Cà phê", "#8B4513"),
                new SubIcon("Pizza", "Pizza", "#FF4500"),
                new SubIcon("Cake", "Bánh ngọt", "#DEB887"),
                new SubIcon("IceCream", "Kem", "#FFC0CB"),
                new SubIcon("Apple", "Trái cây", "#DC143C"),
                new SubIcon("Salad", "Salad", "#90EE90")
            )),

            // Shopping - expandable
            new Group("shopping", "Mua sắm", "EXPENSE", "ShoppingBag", "#EC4899", List.of(
                new SubIcon("ShoppingBag", "Mua sắm", "#EC4899"),
                new SubIcon("Shirt", "Quần áo", "#9370DB"),
                new SubIcon("Footprints", "Giày dép", "#708090"),
                new SubIcon("Watch", "Đồng hồ", "#FFD700"),
                new SubIcon("Gem", "Trang sức", "#E6E6FA"),
                new SubIcon("ShoppingCart", "Siêu thị", "#4ECDC4"),
                new SubIcon("Store", "Cửa hàng", "#4CAF50")
            )),

            // Travel - expandable
            new Group("travel", "Du lịch", "EXPENSE", "Plane", "#3B82F6", List.of(
                new SubIcon("Plane", "Máy bay", "#3B82F6"),
                new SubIcon("Hotel", "Khách sạn", "#45B7D1"),
                new SubIcon("Tent", "Cắm trại", "#228B22"),
                new SubIcon("MapPin", "Địa điểm", "#FF4500"),
                new SubIcon("Bus", "Bus/Tour", "#4CAF50"),
                new SubIcon("Umbrella", "Nghỉ mát", "#FF6B6B")
            )),

            // Health - expandable
            new Group("health", "Sức khỏe", "EXPENSE", "Pill", "#EF4444", List.of(
                new SubIcon("Pill", "Thuốc", "#EF4444"),
                new SubIcon("Stethoscope", "Khám bệnh", "#E0FFFF"),
                new SubIcon("Syringe", "Tiêm", "#FFC0CB"),
                new SubIcon("Heart", "Tim mạch", "#FF1493"),
                new SubIcon("Eye", "Mắt", "#4169E1"),
                new SubIcon("Tooth", "Răng", "#FFFACD"),
                new SubIcon("Shield", "Bảo hiểm", "#4169E1")
            )),

            // Entertainment - expandable
            new Group("entertainment", "Giải trí", "EXPENSE", "Gamepad2", "#8B5CF6", List.of(
                new SubIcon("Gamepad2", "Game", "#8B5CF6"),
                new SubIcon("Film", "Phim", "#DDA0DD"),
                new SubIcon("Music", "Nhạc", "#9370DB"),
                new SubIcon("Mic", "Karaoke", "#FF1493"),
                new SubIcon("Tv", "Streaming", "#E50914"),
                new SubIcon("Clapperboard", "YouTube", "#FF0000")
            )),

            // Pet - expandable
            new Group("pet", "Thú cưng", "EXPENSE", "PawPrint", "#F97316", List.of(
                new SubIcon("PawPrint", "Thú cưng", "#F97316"),
                new SubIcon("Dog", "Chó", "#D2691E"),
                new SubIcon("Cat", "Mèo", "#808080"),
                new SubIcon("Fish", "Cá", "#00CED1"),
                new SubIcon("Bird", "Chim", "#87CEEB")
            )),

            // Grocery - expandable
            new Group("grocery", "Thực phẩm", "EXPENSE", "ShoppingCart", "#22C55E", List.of(
                new SubIcon("ShoppingCart", "Siêu thị", "#22C55E"),
                new SubIcon("Apple", "Rau củ", "#81C784"),
                new SubIcon("Milk", "Sữa", "#FFFACD"),
                new SubIcon("Drumstick", "Thịt", "#CD853F"),
                new SubIcon("Fish", "Cá", "#87CEEB"),
                new SubIcon("Wheat", "Gạo", "#FFF8DC"),
                new SubIcon("Droplets", "Nước", "#00BFFF")
            )),

            // Electronics - expandable
            new Group("electronics", "Điện tử", "EXPENSE", "Smartphone", "#06B6D4", List.of(
                new SubIcon("Smartphone", "Điện thoại", "#06B6D4"),
                new SubIcon("Laptop", "Laptop", "#708090"),
                new SubIcon("Tablet", "Tablet", "#4169E1"),
                new SubIcon("Headphones", "Tai nghe", "#2F4F4F"),
                new SubIcon("Speaker", "Loa", "#FF6B6B"),
                new SubIcon("Camera", "Camera", "#708090"),
                new SubIcon("Tv", "TV", "#4169E1")
            )),

            // Beauty - expandable
            new Group("beauty", "Làm đẹp", "EXPENSE", "Sparkles", "#EC4899", List.of(
                new SubIcon("Sparkles", "Làm đẹp", "#EC4899"),
                new SubIcon("Lipstick", "Son", "#F48FB1"),
                new SubIcon("Palette", "Trang điểm", "#FF69B4"),
                new SubIcon("Crown", "Skincare", "#FFC0CB"),
                new SubIcon("Scissors", "Làm tóc", "#DEB887"),
                new SubIcon("Flower", "Nước hoa", "#DDA0DD")
            )),

            // Sports - expandable
            new Group("sports", "Thể thao", "EXPENSE", "Dumbbell", "#F59E0B", List.of(
                new SubIcon("Dumbbell", "Gym", "#F59E0B"),
                new SubIcon("Soccer", "Bóng đá", "#4CAF50"),
                new SubIcon("Basketball", "Bóng rổ", "#FF9800"),
                new SubIcon("Swimming", "Bơi lội", "#00BCD4"),
                new SubIcon("Footprints", "Chạy bộ", "#F44336"),
                new SubIcon("Bike", "Xe đạp", "#795548")
            )),

            // Education - expandable
            new Group("education", "Giáo dục", "EXPENSE", "GraduationCap", "#6366F1", List.of(
                new SubIcon("GraduationCap", "Giáo dục", "#6366F1"),
                new SubIcon("Book", "Sách", "#8B4513"),
                new SubIcon("Award", "Chứng chỉ", "#FFD700"),
                new SubIcon("Pencil", "Dụng cụ học", "#FF69B4"),
                new SubIcon("Brain", "Khóa học", "#9370DB")
            )),

            // Transport - expandable
            new Group("transport", "Giao thông", "EXPENSE", "Car", "#64748B", List.of(
                new SubIcon("Car", "Ô tô", "#64748B"),
                new SubIcon("Taxi", "Taxi", "#FFD700"),
                new SubIcon("Bus", "Bus", "#32CD32"),
                new SubIcon("Train", "Tàu lửa", "#8B0000"),
                new SubIcon("Plane", "Máy bay", "#87CEEB"),
                new SubIcon("Fuel", "Xăng", "#FF4500"),
                new SubIcon("Wrench", "Bảo dưỡng", "#DAA520"),
                new SubIcon("Bike", "Xe máy", "#2F4F4F")
            )),

            // Home - expandable
            new Group("home", "Nhà", "EXPENSE", "Home", "#10B981", List.of(
                new SubIcon("Home", "Nhà", "#10B981"),
                new SubIcon("Key", "Thuê nhà", "#4169E1"),
                new SubIcon("Zap", "Điện", "#FFD700"),
                new SubIcon("Droplets", "Nước", "#00CED1"),
                new SubIcon("Flame", "Gas", "#FF8C00"),
                new SubIcon("Wifi", "Internet", "#00BFFF"),
                new SubIcon("Wrench", "Sửa chữa", "#808080"),
                new SubIcon("Sofa", "Nội thất", "#8B4513")
            )),

            // Debt - NOT expandable (required for debt feature)
            new Group("debt", "Nợ", "EXPENSE", "CreditCard", "#EF4444", List.of(
                new SubIcon("CreditCard", "Nợ", "#EF4444"),
                new SubIcon("Banknote", "Trả nợ", "#F59E0B")
            )),

            // Savings - NOT expandable (required for savings feature)
            new Group("savings", "Tiết kiệm", "EXPENSE", "PiggyBank", "#F59E0B", List.of(
                new SubIcon("PiggyBank", "Tiết kiệm", "#F59E0B"),
                new SubIcon("Landmark", "Ngân hàng", "#1976D2"),
                new SubIcon("Coins", "Tiền xu", "#FFC107")
            )),

            // --- INCOME GROUPS ---
            new Group("uncategorized_income", "Chưa được phân loại", "INCOME", "HelpCircle", "#9CA3AF", List.of(
                new SubIcon("HelpCircle", "Chưa phân loại", "#9CA3AF")
            )),
            new Group("salary", "Lương", "INCOME", "Briefcase", "#1565C0", List.of(
                new SubIcon("Briefcase", "Lương", "#1565C0"),
                new SubIcon("Banknote", "Tiền mặt", "#4CAF50"),
                new SubIcon("Landmark", "Chuyển khoản", "#1976D2"),
                new SubIcon("Wallet", "Ví", "#22C55E")
            )),
            new Group("investment", "Đầu tư", "INCOME", "TrendingUp", "#00BCD4", List.of(
                new SubIcon("TrendingUp", "Đầu tư", "#00BCD4"),
                new SubIcon("LineChart", "Cổ phiếu", "#673AB7"),
                new SubIcon("Building", "Bất động sản", "#FF9800"),
                new SubIcon("Coins", "Cổ tức", "#FFC107"),
                new SubIcon("PiggyBank", "Lãi tiết kiệm", "#F59E0B")
            )),
            new Group("bonus", "Tiền thưởng", "INCOME", "Trophy", "#FFD700", List.of(
                new SubIcon("Trophy", "Thưởng", "#FFD700"),
                new SubIcon("Gift", "Quà tặng", "#E91E63"),
                new SubIcon("Sparkles", "Lì xì", "#F44336"),
                new SubIcon("Star", "Phần thưởng", "#FFEB3B")
            )),
            new Group("business", "Kinh doanh", "INCOME", "Store", "#8BC34A", List.of(
                new SubIcon("Store", "Cửa hàng", "#8BC34A"),
                new SubIcon("ShoppingCart", "Bán hàng", "#4ECDC4"),
                new SubIcon("Truck", "Vận chuyển", "#795548"),
                new SubIcon("Laptop", "Dịch vụ", "#9C27B0")
            ))
        );
    }
}
