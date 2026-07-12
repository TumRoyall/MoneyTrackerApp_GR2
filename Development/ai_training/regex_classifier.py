"""
Transaction Classification - 100% Regex
======================================
Không cần AI/ML. Chỉ dùng regex + keywords matching.
Chạy trực tiếp trên mobile!

Pipeline:
Input Text → Regex Extract Amount → Keyword Matching → Output JSON
"""

import json
import re
from typing import Dict, List, Optional, Tuple

# ============================================================
# CATEGORIES - ĐÚNG như app MoneyTracker
# ============================================================

# 16 EXPENSE categories
EXPENSE_CATEGORIES = [
    "Chưa phân loại",
    "Thức ăn & Đồ uống",
    "Mua sắm",
    "Du lịch",
    "Sức khỏe",
    "Giải trí",
    "Thú cưng",
    "Thực phẩm",
    "Điện tử",
    "Làm đẹp",
    "Thể thao",
    "Giáo dục",
    "Giao thông",
    "Nhà",
    "Nợ",
    "Tiết kiệm",
]

# 5 INCOME categories
INCOME_CATEGORIES = [
    "Chưa được phân loại",
    "Lương",
    "Đầu tư",
    "Tiền thưởng",
    "Kinh doanh",
]

# Tất cả categories (index = label)
ALL_CATEGORIES = EXPENSE_CATEGORIES + INCOME_CATEGORIES

# Map category name -> category ID for app (từ backend)
CATEGORY_ID_MAP = {
    # EXPENSE (index 0-15)
    "Chưa phân loại": "uncategorized",
    "Thức ăn & Đồ uống": "food",
    "Mua sắm": "shopping",
    "Du lịch": "travel",
    "Sức khỏe": "health",
    "Giải trí": "entertainment",
    "Thú cưng": "pet",
    "Thực phẩm": "grocery",
    "Điện tử": "electronics",
    "Làm đẹp": "beauty",
    "Thể thao": "sports",
    "Giáo dục": "education",
    "Giao thông": "transport",
    "Nhà": "home",
    "Nợ": "debt",
    "Tiết kiệm": "savings",
    # INCOME (index 16-20)
    "Chưa được phân loại": "uncategorized_income",
    "Lương": "salary",
    "Đầu tư": "investment",
    "Tiền thưởng": "bonus",
    "Kinh doanh": "business",
}

# Category -> Type (EXPENSE/INCOME)
CATEGORY_TYPE = {}
for i, cat in enumerate(ALL_CATEGORIES):
    if i < 16:
        CATEGORY_TYPE[cat] = "EXPENSE"
    else:
        CATEGORY_TYPE[cat] = "INCOME"

# ============================================================
# KEYWORDS cho từng category
# ============================================================
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Chưa phân loại": [
        "khác", "linh tinh", "tổng", "chung", "misc", "gì", "chi phí"
    ],

    "Thức ăn & Đồ uống": [
        # Đồ ăn
        "phở", "bún", "cơm", "bánh", "café", "cà phê", "trà sữa", "bánh mì",
        "hủ tiếu", "mì", "pizza", "burger", "gà", "lẩu", "nướng", "ăn", "uống",
        "bia", "kem", "salad", "cháo", "xôi", "trà", "sinh tố", "cafe", "coffee",
        "tra sua", "bánh bao", "bánh cuốn", "cơm rang", "nuoc mía", "táo", "cam",
        "hoa quả", "thịt", "cá", "tôm", "rau", "trứng", "sữa", "gạo", "siêu thị",
        "tạp hóa", "sieu thi", "mini mart", "bánh", "kẹo", "nước ngọt", "bia",
        "rượu", "hamburger", "pizza", "bánh pizza", "gà rán", "gà nướng", "thịt bò",
        "thịt heo", "thịt gà", "cà rốt", "rau muống", "rau cải", "đậu", "nấm",
        "bắp", "ngô", "khoai", "sườn", "chả", "giò", "nem", "gỏi cuốn", "bánh tráng",
        "bún bò", "bún riêu", "hủ tiếu", "mì quảng", "cao lầu", "cơm tấm", "bánh xèo",
        "bánh canh", "bánh giò", "bánh đúc", "chè", "xôi", "cháo", "bún", "phở",
        # Đồ uống
        "cappuccino", "latte", "mocha", "espresso", "americano", "tra dao", "tra chanh",
        "tra oliu", "ca phe sua", "ca phe den", "ca phe hat", "sinh tố", "nước mía",
        "yaourt", "sữa chua", "trái cây", "hoa quả", "nước ép", "smoothie"
    ],

    "Mua sắm": [
        "áo", "quần", "váy", "đầm", "áo sơ mi", "áo thun", "quần jeans", "giày",
        "dép", "túi xách", "balo", "nón", "mũ", "thắt lưng", "đồng hồ", "trang sức",
        "shopping", "shop", "fashion", "clothing", "shoes", "bag", "wallet", "belt",
        "hat", "shopee", "tiki", "lazada", "amazon", "thời trang", "quần áo", "áo quần",
        "vòng", "dây chuyền", "bông", "nhẫn", "khuyên tai", "lắc tay", "lắc chân",
        "váy", "đầm", "yếm", "chân váy", "quần short", "quần dài", "áo khoác",
        "áo len", "áo phông", "áo sơ mi", "áo tanktop", "áo polo", "váy liền",
        "váy xòe", "váy ôm", "đầm casual", "đầm dự tiệc", "đầm maxi"
    ],

    "Du lịch": [
        "máy bay", "vé máy bay", "khách sạn", "resort", "homestay", "hotel", "tour",
        "du lịch", "nghỉ mát", "vacation", "travel", "flight", "airplane", "plane",
        "booking", "airbnb", "hostel", "motel", "visa", "passport", "hộ chiếu", "vali",
        "beach", "bien", "núi", "cano", "tàu thuyền", "bãi biển", "đảo", "canyon",
        "thác", "công viên", "zoo", "sở thú", "bảo tàng", "đền", "chùa", "nhà thờ",
        "booking", "checkin", "checkout", "phòng", "giường", "suite", "deluxe",
        "vé", "ticket", "pass", "hành lý", "suitcase", "backpack", "ba lô",
        "trekking", "camping", "lều", "dịch vụ", "transport", "taxi", "grab",
        "be", "gojek", "xe buyt", "bus", "tàu", "metro", "MRT", "LRT"
    ],

    "Sức khỏe": [
        "thuốc", "khám bệnh", "bệnh viện", "bác sĩ", "thuốc men", "khám", "xét nghiệm",
        "siêu âm", "phòng khám", "tiêm", "vaccine", "bảo hiểm y tế", "nha khoa",
        "răng", "nhổ răng", "mắt", "kính mắt", "tim mạch", "da liễu", "thuốc bổ",
        "vitamin", "thực phẩm chức năng", "medicine", "drug", "pill", "tablet",
        "hospital", "clinic", "doctor", "checkup", "test", "pharmacy", "nhà thuốc",
        "drugstore", "prescription", "medical", "health", "healthcare", "insurance",
        "bhyt", "bảo hiểm", "tai nạn", "cấp cứu", "phẫu thuật", "mổ", "xạ trị",
        "hóa trị", "vật lý trị liệu", "physiotherapy", "massage y tế", " acupuncture",
        "yoga trị liệu", "thể dục trị liệu", "dinh dưỡng", "chế độ ăn", "giảm cân",
        "tăng cân", "protein", "whey protein", "mass gainer", "fat burner"
    ],

    "Giải trí": [
        "phim", "cinema", "rạp phim", "game", "netflix", "spotify", "youtube", "zalo",
        "facebook", "tiktok", "karaoke", "hát", "nhạc", "âm nhạc", "console", "playstation",
        "xbox", "games", "chơi game", "youtube premium", "netflix premium", "spotify premium",
        "disney", "disney+", "prime video", "apple tv", "hbo", "concert", "show", "sự kiện",
        "event", "ticket", "livestream", "podcast", "audiobook", "ebook", "kindle",
        "steam", "epic games", "garena", "riot", "lol", "valorant", "genshin", "pubg",
        "free fire", "manga", "anime", "truyện", "novel", "webtoon", "comic", "DC", "Marvel",
        "series", "drama", "K-drama", "C-drama", "cartoon", "hoạt hình", "livestream",
        "VIP", "premium", "thuê bao", "subscription", "monthly", "yearly"
    ],

    "Thú cưng": [
        "chó", "mèo", "cá", "chim", "thú cưng", "pet", "thức ăn cho pet", "thuốc cho pet",
        "tiêm pet", "tắm pet", "thú y", "đồ chơi cho pet", "pet care", "dog", "cat",
        "fish", "bird", "hamsters", "rabbit", "veterinary", "clinic thu y", "pet shop",
        "cua hang thu cung", "pet store", "aquarium", "ho ca", "bể cá", "xương", "pate",
        "sữa cho chó", "sữa cho mèo", "thuốc chống ve", "thuốc xổ giun", "xịt trùng",
        "spa cho thú cưng", "grooming", "cat tower", "nhà cho chó", "chuồng", "lồng",
        "vòng cổ", "dây dắt", "bàng", "ral", "rọ mõm", "giường thú cưng"
    ],

    "Thực phẩm": [
        "thịt", "thịt heo", "thịt bò", "thịt gà", "cá", "cá hồi", "tôm", "cua",
        "rau", "rau muống", "rau cải", "trái cây", "hoa quả", "táo", "cam", "trứng",
        "sữa", "bơ", "nấm", "đậu", "gạo", "supermarket", "siêu thị", "tạp hóa",
        "sieu thi", "mini mart", "circle k", "gs25", "familymart", "vinmart", "co.opmart",
        "bigc", "aeon", "lotte mart", "food", "grocery", "market", "cà rốt", "bí đỏ",
        "bắp", "ngô", "khoai", "khoai lang", "khoai tay", "sả", "sả khoai", "hành",
        "tỏi", "ớt", "gia vị", "muối", "đường", "nước mắm", "dầu ăn", "bột",
        "bánh tráng", "gỏi cuốn", "nem", "chả", "giò", "pho mai", "sữa chua",
        "yaourt", "cheese", "bơ", "đậu phộng", "đậu xanh", "đậu đen", "đậu đỏ",
        "nước", "nước lọc", "nước giặt", "nước rửa chén", "bát", "đũa", "muỗng"
    ],

    "Điện tử": [
        "điện thoại", "smartphone", "iphone", "samsung", "laptop", "máy tính", "tablet",
        "ipad", "máy ảnh", "camera", "tai nghe", "airpods", "loa", "loa bluetooth",
        "smartwatch", "đồng hồ thông minh", "game console", "playstation", "xbox",
        "sạc", "cáp sạc", "ốp lưng", "usb", "ổ cứng", "electronic", "electronics",
        "tech", "gadget", "computer", "pc", "mac", "imac", "macbook", "surface",
        "dell", "hp", "lenovo", "asus", "acer", "headphone", "earphone", "earbuds",
        "speaker", "soundbar", "webcam", "monitor", "screen", "keyboard", "mouse",
        "cable", "adapter", "hub", "ssd", "hdd", "ram", "cpu", "gpu", "printer",
        "scanner", "router", "wifi", "modem", "sửa điện thoại", "sửa laptop", "sửa máy"
    ],

    "Làm đẹp": [
        "son", "kem", "spa", "massage", "tóc", "làm tóc", "nhuộm", "cắt tóc", "mỹ phẩm",
        "dưỡng", "nước hoa", "lipstick", "kem dưỡng", "skincare", "son môi", "nhuộm tóc",
        "uốn tóc", "gội đầu", "beauty", "cosmetic", "makeup", "hair", "nail", "manicure",
        "pedicure", "facial", "skin care", "serum", "toner", "moisturizer", "sunscreen",
        "kem chống nắng", "perfume", "cologne", "parfum", "set quà tặng", "duong da",
        "cham soc da", "tre hoa", "wax", "shaving", "cạo râu", "tẩy lông", "nặn mụn",
        "đắp mặt nạ", "mask", "serum", "essence", "ampoule", "kem mắt", "kem chống nhăn",
        "kem trị mụn", "kem trị nám", "kem trị thâm", "tẩy tế bào chết", "scrub"
    ],

    "Thể thao": [
        "gym", "tập gym", "thể thao", "chạy bộ", "bơi", "yoga", "tennis", "bóng đá",
        "fitness", "tap gym", "dumbbell", "tạ", "bơi lội", "chạy", "pilates", "bóng rổ",
        "cầu lông", "bida", "leo núi", "hiking", "thẻ gym", "vô gym", "sport", "sports",
        "exercise", "workout", "training", "running", "jogging", "marathon", "cycling",
        "bike", "bicycle", "swimming", "football", "soccer", "basketball", "volleyball",
        "boxing", "mma", "kickboxing", "karate", "judo", "taekwondo", "muay thai",
        "crossfit", "hiit", "cardio", "protein", "whey", "mass", "creatine", "BCAA",
        "giay chạy bộ", "giay thể thao", "quan the thao", "ao the thao", "thẻ gym",
        "vé gym", "phòng gym", "phòng tập", "huấn luyện viên", "PT", "personal trainer"
    ],

    "Giáo dục": [
        "học phí", "sách", "khóa học", "trường", "lớp", "sách giáo khoa", "sách tham khảo",
        "vở", "bút", "thước", "gia sư", "tiếng Anh", "toán", "guitar", "piano", "vẽ",
        "chứng chỉ", "học online", "elearning", "education", "school", "university",
        "college", "course", "book", "textbook", "notebook", "pen", "pencil", "eraser",
        "ruler", "bag", "school bag", "uniform", "hoc phi", "hoc bong", "scholarship",
        "fee", "tuition", "english", "ielts", "toeic", "toefl", "sat", "gre", "gmat",
        "tiếng anh", "tiếng trung", "tiếng nhật", "tiếng hàn", "tiếng pháp",
        "udemy", "coursera", "edx", "skillshare", "workshop", "seminar", "training",
        "conference", "khóa học online", "kyna", "unica", "edumall", "armon",
        "bằng", "chứng chỉ", "thạc sĩ", "tiến sĩ", "đại học", "cao đẳng", "trung cấp"
    ],

    "Giao thông": [
        "xăng", "dầu", "xe máy", "grab", "taxi", "uber", "bus", "buýt", "tàu", "metro",
        "xe", "di xe", "đi xe", "oto", "ô tô", "xe đạp", "parking", "đỗ xe",
        "bảo dưỡng", "sửa xe", "vé xe", "vé bus", "nhiên liệu", "bảo hiểm xe",
        "transport", "gas", "petrol", "fuel", "oil", "gojek", "be", "vietjet",
        "vietnam airline", "vietravel", "train", "tau hoa", "bus station", "ben xe",
        "tram", "vé tháng", "parking fee", "phi do xe", "toll", "phi cầu đường",
        "expressway", "highway", "xe khách", "limousine", "ghe", "giường", "grab",
        "be", "gojek", "now", "baemin", "shopee food", "grabfood", "giao hàng",
        "ship", "vận chuyển", "delivery", "courier"
    ],

    "Nhà": [
        "thuê nhà", "tiền thuê nhà", "điện", "nước", "internet", "wifi", "mạng", "data",
        "4g", "5g", "sim", "điện thoại", "cước", "gas", "ga", "bếp ga", "nhà", "trọ",
        "thuê", "tiền nhà", "tiền điện", "tiền nước", "tiền internet", "sửa chữa",
        "bảo trì", "home", "house", "apartment", "condo", "penthouse", "villa",
        "townhouse", "studio", "rent", "rental", "lease", "utilities", "electricity",
        "water", "gas", "heating", "cooling", "ac", "air conditioner", "internet bill",
        "phone bill", "cable", "tv", "maintenance", "repair", "renovation", "furniture",
        "noi that", "bed", "sofa", "table", "chair", "lamp", "hoa don", "bill",
        "phí quản lý", "phí giữ xe", "phí bảo vệ", "phí dịch vụ", "đặt cọc"
    ],

    "Nợ": [
        "trả nợ", "ghi nợ", "vay nợ", "vay", "nợ", "đi vay", "cho vay", "mượn tiền",
        "trả tiền", "thanh toán", "debt", "borrow", "lend", "loan", "credit",
        "installment", "trả góp", "monthly payment", "interest", "lãi", "principal",
        "gốc", "balance", "số dư nợ", "outstanding", "overdue", "quá hạn", "default",
        "bankruptcy", "bảo lãnh", "guarantor", "cosigner", "giấy nợ", "IOU",
        "hợp đồng", "agreement", "vay mượn", "đòi nợ", "thu nợ", "trả tiền thay",
        "chuyển khoản", "payment", "trả góp", "installment"
    ],

    "Tiết kiệm": [
        "tiết kiệm", "gửi tiết kiệm", "vàng", "quỹ dự phòng", "quỹ khẩn cấp", "đầu tư",
        "chứng khoán", "cổ phiếu", "saving", "savings", "deposit", "fixed deposit",
        "term deposit", "interest", "gold", "silver", "precious metal", "investment",
        "stock", "shares", "bond", "mutual fund", "ETF", "REIT", "cryptocurrency",
        "bitcoin", "ethereum", "forex", "real estate", "bất động sản", "land", "property",
        "emergency fund", "retirement fund", "quỹ hưu trí", "insurance", "bao hiem",
        "life insurance", "health insurance", "endowment", "unit link", "pension",
        "social insurance", "bhxh", "compound interest", "lãi kép", "DCA",
        "gửi tiết kiệm", "mở sổ", "tích lũy", "dự phòng"
    ],

    # INCOME
    "Chưa được phân loại": [
        "khác", "linh tinh", "tổng", "chung", "misc", "thu nhập"
    ],

    "Lương": [
        "lương", "thu nhập", "lĩnh lương", "nhận lương", "trả lương", "salary", "wage",
        "income", "pay", "paycheck", "payroll", "lương tháng", "lương tuần", "lương ngày",
        "payday", "lĩnh lương", "lương tháng 13", "tăng lương", "lương cứng", "lương NET",
        "lương gross", "lương cơ bản", "tiền công", "tiền lương", "thu nhập hàng tháng",
        "tiền lương", "nhận lương", "được lương", "lãnh lương", "rút lương", "ứng lương",
        "lương thử việc", "lương chính thức", "lương part-time", "lương freelance"
    ],

    "Đầu tư": [
        "lãi", "cổ tức", "đầu tư", "chứng khoán", "bán cổ phiếu", "lãi đầu tư",
        "lãi tiết kiệm", "dividend", "interest", "profit", "stock", "share", "bond",
        "investment", "return", "capital gain", "lãi kép", "lãi suất", "lãi ngân hàng",
        "cổ phiếu", "chứng khoán", "VN-Index", "blue chip", "trade", "day trade",
        "quỹ mở", "mutual fund", "ETF", "bất động sản", "cho thuê", "rental income",
        "vàng", "gold", "crypto", "bitcoin", "ethereum", "forex", "ngoại hối",
        "lợi nhuận", "lãi", "lai", "hoàn vốn", "ROI", "yield", "coupon", "trái phiếu"
    ],

    "Tiền thưởng": [
        "thưởng", "lì xì", "quà", "hoa hồng", "commission", "bonus", "gift", "reward",
        "prize", "award", "thưởng tháng", "thưởng quý", "thưởng năm", "thưởng Tết",
        "thưởng dịp lễ", "thưởng thành tích", "thưởng hiệu suất", "thưởng doanh thu",
        "year-end bonus", "performance bonus", "sales bonus", "hoa hồng", "brokerage",
        "referral bonus", "giới thiệu", "referral", "affiliate", "cashback", "hoàn tiền",
        "cash reward", "quà tặng", "gift voucher", "lì xì", "lixi", "red envelope",
        "ang pow", "mừng tuổi", "thưởng Tết", "lương tháng 13", "giải thưởng", "prize",
        "competition prize", "giải nhất", "giải nhì", "giải ba", "xổ số", "trúng thưởng",
        "jackpot", "lottery", "quay số", "may mắn", "trúng"
    ],

    "Kinh doanh": [
        "bán hàng", "kinh doanh", "doanh thu", "buôn bán", "business", "sale", "revenue",
        "profit", "shop", "cửa hàng", "store", "online shop", "shop online", "bán hàng online",
        "thương mại điện tử", "e-commerce", "tiki", "shopee", "lazada", "amazon", "ebay",
        "facebook shop", "instagram shop", "tiktok shop", "woocommerce", "shopify",
        "doanh thu kinh doanh", "khởi nghiệp", "startup", "entrepreneur", "chủ doanh nghiệp",
        "chủ shop", "dropship", "freelance", "freelancer", "gig economy", "side hustle",
        "kinh doanh nhỏ", "small business", "quán", "quán cafe", "quán ăn", "nhà hàng",
        "restaurant", "cafe", "coffee shop", "bars", "pub", "club", "karaoke", "salon",
        "spa", "beauty salon", "nail salon", "barbershop", "tiệm", "cửa hàng tiện lợi",
        "buôn bán", "trade", "wholesale", "bán sỉ", "bán lẻ", "retail", "nhập hàng",
        "xuất hàng", "sản xuất", "manufacturing", "dịch vụ", "service", "consulting",
        "tư vấn", "agency", "marketing agency", "quảng cáo", "advertising", "affiliate"
    ],
}


# ============================================================
# REGEX AMOUNT EXTRACTOR
# ============================================================

def extract_amount(text: str) -> int:
    """
    Extract amount from text using regex.
    Supports: 35k, 2tr, 30 triệu, 100 nghìn, 35ka, 2tr5, 1.5tr, etc.
    """
    text = text.lower().strip()

    # Specific patterns first, fallback last
    patterns = [
        # Triệu
        (r'(\d+)\s*tr(\d+)', lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),  # 2tr5
        (r'(\d+)[.,](\d+)\s*tr', lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),  # 2.5tr
        (r'(\d+)\s*tr\b', lambda m: int(m.group(1)) * 1_000_000),  # 2tr
        (r'(\d+)[.,](\d+)\s*triệu', lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),  # 2.5 triệu
        (r'(\d+)\s*triệu', lambda m: int(m.group(1)) * 1_000_000),  # 30 triệu
        (r'(\d+)\s*(trieu|million)', lambda m: int(m.group(1)) * 1_000_000),  # 2M

        # Nghìn
        (r'(\d+)[.,](\d+)\s*ka\b', lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),  # 35.5ka
        (r'(\d+)\s*ka\b', lambda m: int(m.group(1)) * 1_000),  # 35ka
        (r'(\d+)[.,](\d+)\s*k\b', lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),  # 35.5k
        (r'(\d+)\s*k\b', lambda m: int(m.group(1)) * 1_000),  # 35k
        (r'(\d+)[.,](\d+)\s*(ngan|nghin|nghìn|ngàn)', lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),  # 35.5 nghìn
        (r'(\d+)\s*(ngan|nghin|nghìn|ngàn)', lambda m: int(m.group(1)) * 1_000),  # 35 nghìn
        (r'(ngan|nghin|nghìn|ngàn)\s*(đồng|dong|d)?\s*(\d+)', lambda m: int(m.group(3)) * 1_000),  # ngàn 500
    ]

    for pattern, converter in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                result = converter(match)
                if result > 0:
                    return result
            except (ValueError, AttributeError):
                continue

    # Fallback: số 3-7 chữ số không suffix
    # - num < 100: giữ nguyên (VD: 50 → 50 VND)
    # - num = 1000-9000: nhân 1000 (VD: 1000 → 1,000,000 VND)
    # - num % 1000 == 0: giữ nguyên (VD: 50000 → 50,000 VND)
    # - còn lại: nhân 1000 (VD: 15000 → 15,000 VND)
    match = re.search(r'\b(\d{3,7})\b', text)
    if match:
        num = int(match.group(1))
        if num < 100:
            return num
        if num < 10000 and num % 1000 == 0:
            return num * 1000
        if num % 1000 == 0:
            return num
        return num * 1000

    for pattern, converter in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                result = converter(match)
                if result > 0:
                    return result
            except (ValueError, AttributeError):
                continue

    # Fallback: số 4-7 chữ số không suffix
    match = re.search(r'\b(\d{4,7})\b', text)
    if match:
        num = int(match.group(1))
        if num >= 1000:
            return num

    return 0


# ============================================================
# CONTEXT PATTERNS - Ưu tiên cao hơn keywords thường
# ============================================================

CONTEXT_PATTERNS = [
    # (regex pattern, category, bonus_score)
    # Càng cụ thể → score càng cao

    # INCOME patterns (ưu tiên cao vì dễ nhận biết)
    (r"(lương|thu lương|lĩnh lương)\b", "Lương", 50),
    (r"(thưởng|thưởng tháng|thưởng quý|thưởng năm|thưởng tết)\b", "Tiền thưởng", 50),
    (r"(lì xì|lixi|lì xì|lixì)\b", "Tiền thưởng", 50),
    (r"(cổ tức|lãi|lãi suất|lãi đầu tư|lãi tiết kiệm)\b", "Đầu tư", 50),
    (r"(bán hàng|bán online|doanh thu|kinh doanh)\b", "Kinh doanh", 50),

    # EXPENSE patterns cụ thể
    (r"(netflix|spotify|youtube premium|disney\+|prime video|apple tv|hbo)\b", "Giải trí", 40),
    (r"(gym|tập gym|phòng gym|thẻ gym|vô gym)\b", "Thể thao", 40),
    (r"(khám|bệnh viện|bác sĩ|bs\b|phòng khám)\b", "Sức khỏe", 40),
    (r"(grab|taxi|uber|be\b|gojek)\b", "Giao thông", 40),
    (r"(xăng|dầu xe)\b", "Giao thông", 40),
    (r"(siêu thị|chợ|tạp hóa|market\s|mart\b)", "Thực phẩm", 40),
    (r"(son|mỹ phẩm|làm tóc|cắt tóc|nhuộm tóc)\b", "Làm đẹp", 40),
    (r"(spa|massage)\b", "Làm đẹp", 40),
    (r"(sách|khóa học|học phí|trường|lớp)\b", "Giáo dục", 40),
    (r"(thuê nhà|tiền nhà|tiền thuê)\b", "Nhà", 40),
    (r"(tiền điện|tiền nước|tiền internet|wifi)\b", "Nhà", 40),
    (r"(trả nợ|ghi nợ|vay nợ)\b", "Nợ", 40),
    (r"(gửi tiết kiệm)\b", "Tiết kiệm", 40),
]

# ============================================================
# NEGATIVE KEYWORDS - Loại trừ category sai
# ============================================================

NEGATIVE_KEYWORDS = {
    "Thực phẩm": ["xe máy", "ô tô", "xăng", "sửa nhà", "laptop", "điện thoại"],
    "Giao thông": ["thịt", "cá", "rau", "siêu thị", "chợ"],
    "Giải trí": ["thịt", "cá", "thuốc"],
    "Sức khỏe": ["xăng", "thịt", "laptop"],
}


# ============================================================
# KEYWORD MATCHING CLASSIFIER
# ============================================================

def classify_category(text: str) -> Tuple[str, str]:
    """
    Classify transaction category using context patterns + keyword matching.
    Returns: (category_name, category_type)
    """
    text_lower = text.lower().strip()
    best_match = ("Chưa phân loại", "EXPENSE")
    best_score = 0

    # Bước 1: Check CONTEXT_PATTERNS trước (ưu tiên cao)
    for pattern, category, _ in CONTEXT_PATTERNS:
        if re.search(pattern, text_lower):
            return (category, CATEGORY_TYPE[category])

    # Bước 2: Keyword matching với scoring
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        matched_keywords = []
        has_negative = False

        # Check negative keywords
        negative_kws = NEGATIVE_KEYWORDS.get(category, [])
        for neg_kw in negative_kws:
            if neg_kw in text_lower:
                has_negative = True
                break

        if has_negative:
            continue

        # Score keywords
        for keyword in keywords:
            if keyword.lower() in text_lower:
                score += len(keyword) * len(keyword)  # quadratic: dài hơn = cao hơn
                matched_keywords.append(keyword)

        # Bonus position
        for keyword in matched_keywords:
            idx = text_lower.find(keyword.lower())
            if idx == 0:
                score += 10
            elif idx < 15:
                score += 5

        if score > best_score:
            best_score = score
            best_match = (category, CATEGORY_TYPE[category])

    return best_match


# ============================================================
# MAIN TRANSACTION PARSER
# ============================================================

def parse_transaction(text: str) -> dict:
    """
    Parse transaction text and return structured data.

    Args:
        text: Input text like "ăn phở 45k" or "mua đồ siêu thị hết 500k"

    Returns:
        {
            "amount": int,          # Số tiền VND (từ regex)
            "type": str,            # "EXPENSE" hoặc "INCOME"
            "category": str,        # Tên category (Tiếng Việt)
            "categoryId": str,      # ID cho backend (như "food", "grocery")
            "originalText": str,    # Câu gốc để làm note
        }
    """
    # Step 1: Extract amount using regex
    amount = extract_amount(text)

    # Step 2: Classify category using keyword matching
    category_name, category_type = classify_category(text)

    # Step 3: Get category ID for backend
    category_id = CATEGORY_ID_MAP.get(category_name, "uncategorized")

    return {
        "amount": amount,
        "type": category_type,
        "category": category_name,
        "categoryId": category_id,
        "originalText": text,  # Lưu lại câu gốc để làm note
    }


# ============================================================
# TESTING
# ============================================================

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    print("=" * 60)
    print("Transaction Classification - Regex Version")
    print("=" * 60)

    # Test amount extractor
    print("\n📊 Testing Amount Extractor:")
    test_amounts = [
        ("35k", 35000),
        ("200k", 200000),
        ("2tr", 2000000),
        ("2tr5", 2500000),
        ("1.5tr", 1500000),
        ("30 triệu", 30000000),
        ("100 nghìn", 100000),
        ("50 ngàn", 50000),
        ("35ka", 35000),
        ("ăn phở 45k", 45000),
        ("mua đồ 1000", 1000000),
    ]

    for text, expected in test_amounts:
        result = extract_amount(text)
        status = "✅" if result == expected else "❌"
        print(f"  {status} '{text}' -> {result:,} (expected: {expected:,})")

    # Test transaction parser
    print("\n📝 Testing Transaction Parser:")
    test_cases = [
        # EXPENSE
        "ăn phở 45k",
        "mua áo 200k",
        "xăng xe 80k",
        "uống cafe 35k",
        "mua thịt nấu cơm 150k",
        "đi du lịch 3tr",
        "gym tháng 500k",
        "netflix 70k",
        "mua đồ siêu thị hết 500k",
        "khám bệnh 200k",
        "mua son 150k",
        "sách giáo khoa 100k",
        "vé bus 20k",
        "tiền nhà 5tr",
        "trả nợ 1tr",
        "gửi tiết kiệm 10tr",
        # INCOME
        "lương tháng 15tr",
        "thưởng Tết 5tr",
        "lãi đầu tư 2tr",
        "bán hàng online 500k",
        "cổ tức 1tr",
        "lì xì 200k",
    ]

    print("-" * 80)
    for text in test_cases:
        result = parse_transaction(text)
        print(f"\nInput:  '{text}'")
        print(f"Output: amount={result['amount']:,} VND")
        print(f"        type={result['type']}")
        print(f"        category={result['category']}")
        print(f"        categoryId={result['categoryId']}")

    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60)


# ============================================================
# EXPORT FOR MOBILE (JavaScript/TypeScript)
# ============================================================

def export_to_javascript():
    """Export config as JavaScript for React Native"""
    js_code = '''
// Transaction Classification - Regex Version
// Generated from Python config

export const CATEGORY_ID_MAP = ''' + json.dumps(CATEGORY_ID_MAP, ensure_ascii=False, indent=2) + ''';

export const CATEGORY_TYPE = ''' + json.dumps(CATEGORY_TYPE, ensure_ascii=False, indent=2) + ''';

export const CATEGORY_KEYWORDS = ''' + json.dumps(CATEGORY_KEYWORDS, ensure_ascii=False, indent=2) + ''';

// Amount patterns for regex
const AMOUNT_PATTERNS = [
    // Triệu: 2tr, 2.5tr, 2tr5, 2 triệu
    { regex: /(\\d+)\\s*tr/i, convert: m => parseInt(m[1]) * 1000000 },
    { regex: /(\\d+)[.,](\\d+)\\s*tr/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    { regex: /(\\d+)\\s*tr(\\d+)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    { regex: /(\\d+)\\s*(trieu|million)\\s*(đồng|dong|d)?/i, convert: m => parseInt(m[1]) * 1000000 },

    // Nghìn/ngàn/ka
    { regex: /(\\d+)\\s*ka\\b/i, convert: m => parseInt(m[1]) * 1000 },
    { regex: /(\\d+)[.,](\\d+)\\s*ka\\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\\d+)\\s*k\\b/i, convert: m => parseInt(m[1]) * 1000 },
    { regex: /(\\d+)[.,](\\d+)\\s*k\\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\\d+)\\s*(ngan|nghin|nghìn|ngàn)\\s*(đồng|dong|d)?/i, convert: m => parseInt(m[1]) * 1000 },

    // Nghìn đồng đứng trước
    { regex: /(ngan|nghin|nghìn|ngàn)\\s*(đồng|dong|d)?\\s*(\\d+)/i, convert: m => parseInt(m[3]) * 1000 },
];

export function extractAmount(text) {
    const lower = text.toLowerCase().trim();

    for (const { regex, convert } of AMOUNT_PATTERNS) {
        const match = lower.match(regex);
        if (match) {
            const result = convert(match);
            if (result > 0) return result;
        }
    }

    // Fallback: số 4-7 chữ số
    const numMatch = lower.match(/\\b(\\d{4,7})\\b/);
    if (numMatch && parseInt(numMatch[1]) >= 1000) {
        return parseInt(numMatch[1]);
    }

    return 0;
}

export function classifyCategory(text) {
    const lower = text.toLowerCase().trim();

    let bestMatch = { category: "Chưa phân loại", type: "EXPENSE", score: 0 };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        let matchedKeywords = [];

        for (const keyword of keywords) {
            if (lower.includes(keyword.toLowerCase())) {
                score += keyword.length;
                matchedKeywords.push(keyword);
            }
        }

        // Bonus: vị trí keyword
        for (const keyword of matchedKeywords) {
            const idx = lower.indexOf(keyword.toLowerCase());
            if (idx === 0) score += 5;
            else if (idx < 10) score += 2;
        }

        if (score > bestMatch.score) {
            bestMatch = { category, type: CATEGORY_TYPE[category], score };
        }
    }

    return { categoryName: bestMatch.category, type: bestMatch.type };
}

export function parseTransaction(text) {
    const amount = extractAmount(text);
    const { categoryName, type } = classifyCategory(text);

    return {
        amount,
        type,
        category: categoryName,
        categoryId: CATEGORY_ID_MAP[categoryName] || "uncategorized",
        originalText: text,
    };
}

// Ví dụ sử dụng:
// parseTransaction("ăn phở 45k")
// => { amount: 45000, type: "EXPENSE", category: "Thức ăn & Đồ uống", categoryId: "food", originalText: "ăn phở 45k" }
'''
    return js_code


if __name__ == "__main__":
    js_output = export_to_javascript()
    with open("transaction_classifier.js", "w", encoding="utf-8") as f:
        f.write(js_output)
    print("\n📁 Exported to transaction_classifier.js")
