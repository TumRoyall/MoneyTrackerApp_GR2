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
 */
public final class CategoryGroups {

    public static final String NAMESPACE = "moneytracker-default-category-v2";

    public record SubIcon(String icon, String label, String color) {}

    public record Group(String id, String name, String type, List<SubIcon> subIcons) {}

    private CategoryGroups() {}

    public static List<Group> all() {
        return List.of(
            new Group("food", "Thức ăn & Đồ uống", "EXPENSE", List.of(
                new SubIcon("food-fork-drink", "Đồ ăn", "#FF6B6B"),
                new SubIcon("coffee", "Cà phê", "#8B4513"),
                new SubIcon("cup", "Đồ uống", "#87CEEB"),
                new SubIcon("silverware-fork-knife", "Nhà hàng", "#DDA0DD"),
                new SubIcon("cookie", "Bánh ngọt", "#DEB887"),
                new SubIcon("food-takeout-box", "Mang đi", "#F4A460"),
                new SubIcon("pizza", "Pizza", "#FF4500"),
                new SubIcon("noodles", "Mì", "#FFD700"),
                new SubIcon("hamburger", "Hamburger", "#FFA500"),
                new SubIcon("ice-cream", "Kem", "#FFC0CB"),
                new SubIcon("fruit-cherries", "Trái cây", "#DC143C"),
                new SubIcon("bowl-mix", "Salad", "#90EE90")
            )),
            new Group("shopping", "Mua sắm", "EXPENSE", List.of(
                new SubIcon("cart", "Siêu thị", "#4ECDC4"),
                new SubIcon("shopping", "Mua sắm", "#FF69B4"),
                new SubIcon("tshirt-crew", "Quần áo", "#9370DB"),
                new SubIcon("shoe-sneaker", "Giày dép", "#708090"),
                new SubIcon("bag-personal", "Túi xách", "#D2691E"),
                new SubIcon("watch", "Đồng hồ", "#FFD700"),
                new SubIcon("diamond-stone", "Trang sức", "#E6E6FA"),
                new SubIcon("hanger", "Thời trang", "#DDA0DD"),
                new SubIcon("shopping-outline", "Online", "#FF6B6B"),
                new SubIcon("store", "Cửa hàng", "#4CAF50")
            )),
            new Group("travel", "Du lịch", "EXPENSE", List.of(
                new SubIcon("airplane", "Máy bay", "#45B7D1"),
                new SubIcon("beach", "Biển", "#00CED1"),
                new SubIcon("passport", "Passport", "#4169E1"),
                new SubIcon("hiking", "Leo núi", "#228B22"),
                new SubIcon("campfire", "Cắm trại", "#8B4513"),
                new SubIcon("umbrella", "Nghỉ mát", "#FF6B6B"),
                new SubIcon("map-marker", "Địa điểm", "#FF4500"),
                new SubIcon("bus", "Tour", "#4CAF50")
            )),
            new Group("health", "Sức khỏe", "EXPENSE", List.of(
                new SubIcon("pill", "Thuốc", "#FF8A80"),
                new SubIcon("hospital-box", "Bệnh viện", "#FF0000"),
                new SubIcon("stethoscope", "Khám bệnh", "#E0FFFF"),
                new SubIcon("needle", "Tiêm", "#FFC0CB"),
                new SubIcon("medical-bag", "Y tế", "#F0F8FF"),
                new SubIcon("heart-pulse", "Tim mạch", "#FF1493"),
                new SubIcon("brain", "Thần kinh", "#9370DB"),
                new SubIcon("eye", "Mắt", "#4169E1"),
                new SubIcon("tooth", "Răng", "#FFFACD"),
                new SubIcon("shield-check", "Bảo hiểm", "#4169E1")
            )),
            new Group("entertainment", "Giải trí", "EXPENSE", List.of(
                new SubIcon("movie", "Phim", "#DDA0DD"),
                new SubIcon("gamepad-variant", "Game", "#4B0082"),
                new SubIcon("music", "Nhạc", "#9370DB"),
                new SubIcon("microphone", "Karaoke", "#FF1493"),
                new SubIcon("youtube", "YouTube", "#FF0000"),
                new SubIcon("netflix", "Streaming", "#E50914"),
                new SubIcon("gamepad", "Console", "#2F4F4F"),
                new SubIcon("puzzle", "Cờ", "#FFD700"),
                new SubIcon("spa", "Spa", "#FF69B4")
            )),
            new Group("pet", "Thú cưng", "EXPENSE", List.of(
                new SubIcon("dog", "Chó", "#D2691E"),
                new SubIcon("cat", "Mèo", "#808080"),
                new SubIcon("fish", "Cá", "#00CED1"),
                new SubIcon("bird", "Chim", "#87CEEB"),
                new SubIcon("food-drumstick", "Thức ăn pet", "#CD853F"),
                new SubIcon("doctor", "Thú y", "#FFFFFF"),
                new SubIcon("toy-brick", "Đồ chơi", "#FF69B4"),
                new SubIcon("bed", "Pet bed", "#DEB887"),
                new SubIcon("shower", "Tắm pet", "#87CEEB")
            )),
            new Group("grocery", "Thực phẩm", "EXPENSE", List.of(
                new SubIcon("food-apple", "Rau củ", "#81C784"),
                new SubIcon("egg", "Trứng", "#FFF8DC"),
                new SubIcon("cheese", "Sữa", "#FFFACD"),
                new SubIcon("food-drumstick", "Thịt", "#CD853F"),
                new SubIcon("fish", "Cá", "#87CEEB"),
                new SubIcon("rice", "Gạo", "#FFF8DC"),
                new SubIcon("peanut", "Hạt", "#DEB887"),
                new SubIcon("leaf", "Rau xanh", "#228B22"),
                new SubIcon("water", "Nước", "#00BFFF")
            )),
            new Group("electronics", "Điện tử", "EXPENSE", List.of(
                new SubIcon("cellphone", "Điện thoại", "#90CAF9"),
                new SubIcon("laptop", "Laptop", "#708090"),
                new SubIcon("tablet", "Tablet", "#4169E1"),
                new SubIcon("headphones", "Tai nghe", "#2F4F4F"),
                new SubIcon("watch", " smartwatch", "#FFD700"),
                new SubIcon("speaker", "Loa", "#FF6B6B"),
                new SubIcon("camera", "Camera", "#708090"),
                new SubIcon("gamepad", "Gaming", "#9370DB"),
                new SubIcon("usb", "Phụ kiện", "#4ECDC4")
            )),
            new Group("beauty", "Làm đẹp", "EXPENSE", List.of(
                new SubIcon("lipstick", "Son", "#F48FB1"),
                new SubIcon("palette", "Trang điểm", "#FF69B4"),
                new SubIcon("face-woman-shimmer", "Skincare", "#FFC0CB"),
                new SubIcon("hair-dryer", "Làm tóc", "#DEB887"),
                new SubIcon("nail", "Nail", "#FF1493"),
                new SubIcon("spa", "Spa", "#F8BBD9"),
                new SubIcon("meditation", "Massage", "#E1BEE7"),
                new SubIcon("flower", "Nước hoa", "#DDA0DD")
            )),
            new Group("sports", "Thể thao", "EXPENSE", List.of(
                new SubIcon("dumbbell", "Gym", "#FF7043"),
                new SubIcon("football", "Bóng đá", "#4CAF50"),
                new SubIcon("basketball", "Bóng rổ", "#FF9800"),
                new SubIcon("tennis", "Tennis", "#FFEB3B"),
                new SubIcon("swim", "Bơi lội", "#00BCD4"),
                new SubIcon("run", "Chạy bộ", "#F44336"),
                new SubIcon("yoga", "Yoga", "#9C27B0"),
                new SubIcon("bike", "Xe đạp", "#795548"),
                new SubIcon("hiking", "Leo núi", "#4CAF50")
            )),
            new Group("education", "Giáo dục", "EXPENSE", List.of(
                new SubIcon("book", "Sách", "#8B4513"),
                new SubIcon("school", "Học phí", "#4169E1"),
                new SubIcon("certificate", "Chứng chỉ", "#FFD700"),
                new SubIcon("pencil", "Dụng cụ học", "#FF69B4"),
                new SubIcon("pen", "Văn phòng phẩm", "#4169E1"),
                new SubIcon("laptop", "Học online", "#708090"),
                new SubIcon("brain", "Khóa học", "#9370DB"),
                new SubIcon("trophy", "Thành tích", "#FFD700")
            )),
            new Group("transport", "Giao thông", "EXPENSE", List.of(
                new SubIcon("gas-station", "Xăng", "#FF4500"),
                new SubIcon("car", "Ô tô", "#4682B4"),
                new SubIcon("motorbike", "Xe máy", "#2F4F4F"),
                new SubIcon("taxi", "Taxi", "#FFD700"),
                new SubIcon("bus", "Bus", "#32CD32"),
                new SubIcon("train", "Tàu lửa", "#8B0000"),
                new SubIcon("airplane", "Máy bay", "#87CEEB"),
                new SubIcon("parking", "Parking", "#708090"),
                new SubIcon("car-wrench", "Bảo dưỡng", "#DAA520"),
                new SubIcon("bicycle", "Xe đạp", "#006400")
            )),
            new Group("home", "Nhà", "EXPENSE", List.of(
                new SubIcon("home", "Nhà", "#A5D6A7"),
                new SubIcon("key-variant", "Thuê nhà", "#4169E1"),
                new SubIcon("flash", "Điện", "#FFD700"),
                new SubIcon("water", "Nước", "#00CED1"),
                new SubIcon("gas-cylinder", "Gas", "#FF8C00"),
                new SubIcon("wifi", "Internet", "#00BFFF"),
                new SubIcon("wrench", "Sửa chữa", "#808080"),
                new SubIcon("sofa", "Nội thất", "#8B4513"),
                new SubIcon("broom", "Dọn dẹp", "#BC8F8F"),
                new SubIcon("lamp", "Điện", "#FFFACD")
            )),
            new Group("savings", "Tiết kiệm", "EXPENSE", List.of(
                new SubIcon("piggy-bank", "Tiết kiệm", "#FF9800"),
                new SubIcon("bank", "Ngân hàng", "#1976D2"),
                new SubIcon("safe", "Két sắt", "#616161"),
                new SubIcon("wallet-plus", "Quỹ dự phòng", "#4CAF50"),
                new SubIcon("gold", "Vàng", "#FFD700"),
                new SubIcon("cash-multiple", "Tiền xu", "#FFC107")
            )),
            new Group("income", "Thu nhập", "INCOME", List.of(
                new SubIcon("briefcase", "Lương", "#1565C0"),
                new SubIcon("trophy", "Thưởng", "#FFD700"),
                new SubIcon("cash-plus", "Phụ cấp", "#2196F3"),
                new SubIcon("account-cash", "Hoa hồng", "#4CAF50"),
                new SubIcon("chart-timeline-variant", "Đầu tư", "#00BCD4"),
                new SubIcon("piggy-bank", "Tiết kiệm", "#FF9800"),
                new SubIcon("store", "Kinh doanh", "#8BC34A"),
                new SubIcon("laptop", "Freelance", "#9C27B0"),
                new SubIcon("gift", "Quà tặng", "#E91E63"),
                new SubIcon("cash", "Khác", "#607D8B")
            )),
            // Group "debt" — added 2026-06-06 to support DebtDetailScreen which
            // previously created a custom "Nợ" category at runtime. Now hardcoded
            // here so DebtDetail can lookup by groupId='debt' without createCategory.
            new Group("debt", "Nợ", "EXPENSE", List.of(
                new SubIcon("credit-card", "Nợ", "#FBE8E6"),
                new SubIcon("cash-refund", "Trả nợ", "#D32F2F")
            ))
        );
    }
}
