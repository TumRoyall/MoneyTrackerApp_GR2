"""
Keyword Rules Module
=================
Fallback keyword matching for category detection.

This module provides keyword-based classification as a fallback
when context rules don't produce confident results.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

from .config import (
    CATEGORY_TYPE,
    TransactionType,
    ScoringWeights,
)


@dataclass
class KeywordRule:
    """
    A keyword rule for category classification.

    Attributes:
        keywords: List of keywords that trigger this rule
        category: Target category
        transaction_type: EXPENSE or INCOME
        weight: Base weight for scoring
        priority: Higher = more important
    """
    keywords: List[str]
    category: str
    transaction_type: TransactionType = TransactionType.EXPENSE
    weight: float = 20.0
    priority: int = 1


class KeywordMatcher:
    """
    Keyword-based category matcher.

    This is the FALLBACK classifier - used when context rules
    don't provide confident results.

    Features:
    - Weighted scoring
    - Position bonuses
    - Negative keyword exclusion
    - Multi-keyword aggregation
    """

    def __init__(self):
        """Initialize the keyword matcher."""
        self._rules: List[KeywordRule] = []
        self._category_index: Dict[str, List[KeywordRule]] = {}
        self._keyword_index: Dict[str, List[KeywordRule]] = {}
        self._build_rules()

    def _build_rules(self) -> None:
        """Build the complete keyword rule set."""

        # ============================================================
        # EXPENSE KEYWORDS
        # ============================================================

        # Food & Beverage
        self.add_rule(KeywordRule(
            keywords=["phở", "bún", "cơm", "bánh", "café", "cà phê", "trà sữa", "bánh mì",
                     "hủ tiếu", "mì", "pizza", "burger", "gà", "lẩu", "nướng", "ăn", "uống",
                     "bia", "kem", "salad", "cháo", "xôi", "trà", "sinh tố", "cafe", "coffee",
                     "tra sua", "bánh bao", "bánh cuốn", "cơm rang", "nước mía", "táo", "cam",
                     "hoa quả", "thịt", "cá", "tôm", "rau", "trứng", "sữa", "gạo", "siêu thị",
                     "tạp hóa", "sieu thi", "bánh", "kẹo", "nước ngọt", "rượu", "hamburger",
                     "pizza", "gà rán", "gà nướng", "thịt bò", "thịt heo", "thịt gà",
                     "cappuccino", "latte", "mocha", "espresso", "americano", "tra dao", "tra chanh",
                     "tra oliu", "ca phe sua", "ca phe den", "yaourt", "sữa chua", "nước ép", "smoothie"],
            category="Thức ăn & Đồ uống",
            weight=25.0,
            priority=2,
        ))

        # Shopping
        self.add_rule(KeywordRule(
            keywords=["áo", "quần", "váy", "đầm", "áo sơ mi", "áo thun", "quần jeans", "giày",
                     "dép", "túi xách", "balo", "nón", "mũ", "thắt lưng", "đồng hồ", "trang sức",
                     "shopping", "shop", "fashion", "clothing", "shoes", "bag", "wallet", "belt",
                     "hat", "thời trang", "quần áo", "áo quần", "vòng", "dây chuyền", "bông",
                     "nhẫn", "khuyên tai", "lắc tay", "lắc chân", "áo khoác", "áo len", "áo phông",
                     "váy liền", "váy xòe", "váy ôm", "đầm casual", "đầm dự tiệc"],
            category="Mua sắm",
            weight=25.0,
            priority=2,
        ))

        # Transport
        self.add_rule(KeywordRule(
            keywords=["xăng", "dầu", "xe máy", "grab", "taxi", "uber", "bus", "buýt", "tàu", "metro",
                     "xe", "di xe", "đi xe", "oto", "ô tô", "xe đạp", "parking", "đỗ xe",
                     "bảo dưỡng", "sửa xe", "vé xe", "vé bus", "nhiên liệu", "bảo hiểm xe",
                     "transport", "gas", "petrol", "fuel", "oil", "gojek", "be", "vietjet",
                     "vietnam airline", "vietravel", "train", "tau hoa", "tram", "vé tháng",
                     "phi cầu đường", "expressway", "xe khách", "limousine", "giao hàng",
                     "ship", "vận chuyển", "delivery", "courier", "grabfood", "baemin"],
            category="Giao thông",
            weight=25.0,
            priority=2,
        ))

        # Entertainment
        self.add_rule(KeywordRule(
            keywords=["phim", "cinema", "rạp phim", "game", "netflix", "spotify", "youtube", "zalo",
                     "facebook", "tiktok", "karaoke", "hát", "nhạc", "âm nhạc", "console", "playstation",
                     "xbox", "games", "chơi game", "youtube premium", "netflix premium", "spotify premium",
                     "disney", "disney+", "prime video", "apple tv", "hbo", "concert", "show", "sự kiện",
                     "event", "ticket", "livestream", "podcast", "audiobook", "ebook", "kindle",
                     "steam", "epic games", "garena", "riot", "lol", "valorant", "genshin", "pubg",
                     "free fire", "manga", "anime", "truyện", "series", "drama", "VIP", "premium",
                     "thuê bao", "subscription"],
            category="Giải trí",
            weight=25.0,
            priority=2,
        ))

        # Health
        self.add_rule(KeywordRule(
            keywords=["thuốc", "khám bệnh", "bệnh viện", "bác sĩ", "thuốc men", "khám", "xét nghiệm",
                     "siêu âm", "phòng khám", "tiêm", "vaccine", "bảo hiểm y tế", "nha khoa",
                     "răng", "nhổ răng", "mắt", "kính mắt", "tim mạch", "da liễu", "thuốc bổ",
                     "vitamin", "thực phẩm chức năng", "medicine", "drug", "pill", "tablet",
                     "hospital", "clinic", "doctor", "checkup", "test", "pharmacy", "nhà thuốc",
                     "drugstore", "prescription", "medical", "health", "healthcare", "insurance",
                     "bhyt", "bảo hiểm", "tai nạn", "cấp cứu", "phẫu thuật", "mổ", "xạ trị",
                     "hóa trị", "vật lý trị liệu", "physiotherapy", "massage y tế", "yoga trị liệu",
                     "dinh dưỡng", "chế độ ăn", "giảm cân", "tăng cân", "protein", "whey protein"],
            category="Sức khỏe",
            weight=25.0,
            priority=2,
        ))

        # Grocery
        self.add_rule(KeywordRule(
            keywords=["thịt", "thịt heo", "thịt bò", "thịt gà", "cá", "cá hồi", "tôm", "cua",
                     "rau", "rau muống", "rau cải", "trái cây", "hoa quả", "táo", "cam", "trứng",
                     "sữa", "bơ", "nấm", "đậu", "gạo", "supermarket", "siêu thị", "tạp hóa",
                     "sieu thi", "circle k", "gs25", "familymart", "vinmart", "co.opmart",
                     "bigc", "aeon", "lotte mart", "food", "grocery", "market", "cà rốt", "bí đỏ",
                     "bắp", "ngô", "khoai", "khoai lang", "khoai tay", "sả", "hành",
                     "tỏi", "ớt", "gia vị", "muối", "đường", "nước mắm", "dầu ăn", "bột",
                     "bánh tráng", "gỏi cuốn", "nem", "chả", "giò", "pho mai", "sữa chua",
                     "yaourt", "cheese", "đậu phộng", "nước", "nước lọc", "nước giặt"],
            category="Thực phẩm",
            weight=25.0,
            priority=2,
        ))

        # Electronics
        self.add_rule(KeywordRule(
            keywords=["điện thoại", "smartphone", "iphone", "samsung", "laptop", "máy tính", "tablet",
                     "ipad", "máy ảnh", "camera", "tai nghe", "airpods", "loa", "loa bluetooth",
                     "smartwatch", "đồng hồ thông minh", "game console", "playstation", "xbox",
                     "sạc", "cáp sạc", "ốp lưng", "usb", "ổ cứng", "electronic", "electronics",
                     "tech", "gadget", "computer", "pc", "mac", "imac", "macbook", "surface",
                     "dell", "hp", "lenovo", "asus", "acer", "headphone", "earphone", "earbuds",
                     "speaker", "soundbar", "webcam", "monitor", "screen", "keyboard", "mouse",
                     "cable", "adapter", "hub", "ssd", "hdd", "ram", "cpu", "gpu", "printer",
                     "scanner", "router", "wifi", "modem", "sửa điện thoại", "sửa laptop", "sửa máy"],
            category="Điện tử",
            weight=25.0,
            priority=2,
        ))

        # Beauty
        self.add_rule(KeywordRule(
            keywords=["son", "kem", "spa", "massage", "tóc", "làm tóc", "nhuộm", "cắt tóc", "mỹ phẩm",
                     "dưỡng", "nước hoa", "lipstick", "kem dưỡng", "skincare", "son môi", "nhuộm tóc",
                     "uốn tóc", "gội đầu", "beauty", "cosmetic", "makeup", "hair", "nail", "manicure",
                     "pedicure", "facial", "skin care", "serum", "toner", "moisturizer", "sunscreen",
                     "kem chống nắng", "perfume", "cologne", "parfum", "duong da", "cham soc da",
                     "wax", "shaving", "cạo râu", "tẩy lông", "nặn mụn", "đắp mặt nạ", "mask",
                     "essence", "ampoule", "kem mắt", "kem chống nhăn", "kem trị mụn", "scrub"],
            category="Làm đẹp",
            weight=25.0,
            priority=2,
        ))

        # Sports
        self.add_rule(KeywordRule(
            keywords=["gym", "tập gym", "thể thao", "chạy bộ", "bơi", "yoga", "tennis", "bóng đá",
                     "fitness", "tap gym", "dumbbell", "tạ", "bơi lội", "chạy", "pilates", "bóng rổ",
                     "cầu lông", "bida", "leo núi", "hiking", "thẻ gym", "vô gym", "sport", "sports",
                     "exercise", "workout", "training", "running", "jogging", "marathon", "cycling",
                     "bike", "bicycle", "swimming", "football", "soccer", "basketball", "volleyball",
                     "boxing", "mma", "kickboxing", "karate", "judo", "taekwondo", "muay thai",
                     "crossfit", "hiit", "cardio", "giày chạy bộ", "giày thể thao", "thẻ gym",
                     "vé gym", "phòng gym", "phòng tập", "huấn luyện viên", "PT"],
            category="Thể thao",
            weight=25.0,
            priority=2,
        ))

        # Education
        self.add_rule(KeywordRule(
            keywords=["học phí", "sách", "khóa học", "trường", "lớp", "sách giáo khoa", "sách tham khảo",
                     "vở", "bút", "thước", "gia sư", "tiếng Anh", "toán", "guitar", "piano", "vẽ",
                     "chứng chỉ", "học online", "elearning", "education", "school", "university",
                     "college", "course", "book", "textbook", "notebook", "pen", "pencil", "eraser",
                     "ruler", "bag", "school bag", "uniform", "hoc phi", "hoc bong", "scholarship",
                     "fee", "tuition", "tiếng anh", "tiếng trung", "tiếng nhật", "tiếng hàn",
                     "udemy", "coursera", "edx", "skillshare", "workshop", "seminar", "training",
                     "bằng", "thạc sĩ", "tiến sĩ", "đại học", "cao đẳng", "trung cấp"],
            category="Giáo dục",
            weight=25.0,
            priority=2,
        ))

        # Home
        self.add_rule(KeywordRule(
            keywords=["thuê nhà", "tiền thuê nhà", "điện", "nước", "internet", "wifi", "mạng", "data",
                     "4g", "5g", "sim", "cước", "gas", "ga", "bếp ga", "nhà", "trọ",
                     "thuê", "tiền nhà", "tiền điện", "tiền nước", "tiền internet", "sửa chữa",
                     "bảo trì", "home", "house", "apartment", "condo", "penthouse", "villa",
                     "townhouse", "studio", "rent", "rental", "lease", "utilities", "electricity",
                     "water", "gas", "heating", "cooling", "ac", "air conditioner", "internet bill",
                     "phone bill", "cable", "tv", "maintenance", "repair", "renovation", "furniture",
                     "noi that", "bed", "sofa", "table", "chair", "lamp", "hoa don", "bill",
                     "phí quản lý", "phí giữ xe", "phí bảo vệ", "phí dịch vụ", "đặt cọc"],
            category="Nhà",
            weight=25.0,
            priority=2,
        ))

        # Travel
        self.add_rule(KeywordRule(
            keywords=["máy bay", "vé máy bay", "khách sạn", "resort", "homestay", "hotel", "tour",
                     "du lịch", "nghỉ mát", "vacation", "travel", "flight", "airplane", "plane",
                     "booking", "airbnb", "hostel", "motel", "visa", "passport", "hộ chiếu", "vali",
                     "beach", "bien", "núi", "cano", "tàu thuyền", "bãi biển", "đảo", "canyon",
                     "thác", "công viên", "zoo", "sở thú", "bảo tàng", "đền", "chùa", "nhà thờ",
                     "checkin", "checkout", "phòng", "giường", "suite", "deluxe",
                     "vé", "ticket", "pass", "hành lý", "suitcase", "backpack", "ba lô",
                     "trekking", "camping", "lều", "dịch vụ", "taxi", "xe buýt", "bus", "tàu", "metro"],
            category="Du lịch",
            weight=25.0,
            priority=2,
        ))

        # Pet
        self.add_rule(KeywordRule(
            keywords=["chó", "mèo", "cá", "chim", "thú cưng", "pet", "thức ăn cho pet", "thuốc cho pet",
                     "tiêm pet", "tắm pet", "thú y", "đồ chơi cho pet", "pet care", "dog", "cat",
                     "fish", "bird", "hamsters", "rabbit", "veterinary", "clinic thu y", "pet shop",
                     "cua hang thu cung", "pet store", "aquarium", "ho ca", "bể cá", "xương", "pate",
                     "sữa cho chó", "sữa cho mèo", "thuốc chống ve", "thuốc xổ giun", "xịt trùng",
                     "spa cho thú cưng", "grooming", "cat tower", "nhà cho chó", "chuồng", "lồng",
                     "vòng cổ", "dây dắt", "bàng", "ral", "rọ mõm", "giường thú cưng"],
            category="Thú cưng",
            weight=25.0,
            priority=2,
        ))

        # Debt
        self.add_rule(KeywordRule(
            keywords=["trả nợ", "ghi nợ", "vay nợ", "vay", "nợ", "đi vay", "cho vay", "mượn tiền",
                     "thanh toán", "debt", "borrow", "lend", "loan", "credit",
                     "installment", "trả góp", "monthly payment", "interest", "lãi", "principal",
                     "gốc", "balance", "số dư nợ", "outstanding", "overdue", "quá hạn", "default",
                     "bankruptcy", "bảo lãnh", "guarantor", "cosigner", "giấy nợ", "IOU",
                     "hợp đồng", "agreement", "vay mượn", "đòi nợ", "thu nợ", "trả tiền thay",
                     "chuyển khoản", "payment"],
            category="Nợ",
            weight=25.0,
            priority=2,
        ))

        # Savings
        self.add_rule(KeywordRule(
            keywords=["tiết kiệm", "gửi tiết kiệm", "vàng", "quỹ dự phòng", "quỹ khẩn cấp",
                     "saving", "savings", "deposit", "fixed deposit", "term deposit", "interest",
                     "gold", "silver", "precious metal", "emergency fund", "retirement fund",
                     "quỹ hưu trí", "insurance", "bao hiem", "life insurance", "health insurance",
                     "endowment", "unit link", "pension", "social insurance", "bhxh",
                     "compound interest", "lãi kép", "DCA", "mở sổ", "tích lũy", "dự phòng"],
            category="Tiết kiệm",
            weight=25.0,
            priority=2,
        ))

        # ============================================================
        # INCOME KEYWORDS
        # ============================================================

        # Salary
        self.add_rule(KeywordRule(
            keywords=["lương", "thu nhập", "lĩnh lương", "nhận lương", "trả lương", "salary", "wage",
                     "pay", "paycheck", "payroll", "lương tháng", "lương tuần", "lương ngày",
                     "payday", "lương tháng 13", "tăng lương", "lương cứng", "lương NET",
                     "lương gross", "lương cơ bản", "tiền công", "tiền lương", "lãnh lương",
                     "rút lương", "ứng lương", "lương thử việc", "lương chính thức"],
            category="Lương",
            transaction_type=TransactionType.INCOME,
            weight=30.0,
            priority=3,
        ))

        # Investment
        self.add_rule(KeywordRule(
            keywords=["lãi", "cổ tức", "đầu tư", "chứng khoán", "bán cổ phiếu", "lãi đầu tư",
                     "lãi tiết kiệm", "dividend", "interest", "profit", "stock", "share", "bond",
                     "investment", "return", "capital gain", "lãi kép", "lãi suất", "lãi ngân hàng",
                     "cổ phiếu", "chứng khoán", "VN-Index", "blue chip", "trade", "day trade",
                     "quỹ mở", "mutual fund", "ETF", "bất động sản", "cho thuê",
                     "vàng", "gold", "crypto", "bitcoin", "ethereum", "forex",
                     "lợi nhuận", "hoàn vốn", "ROI", "yield", "coupon", "trái phiếu"],
            category="Đầu tư",
            transaction_type=TransactionType.INCOME,
            weight=30.0,
            priority=3,
        ))

        # Bonus
        self.add_rule(KeywordRule(
            keywords=["thưởng", "lì xì", "quà", "hoa hồng", "commission", "bonus", "gift", "reward",
                     "prize", "award", "thưởng tháng", "thưởng quý", "thưởng năm", "thưởng Tết",
                     "thưởng dịp lễ", "thưởng thành tích", "thưởng hiệu suất", "thưởng doanh thu",
                     "year-end bonus", "performance bonus", "sales bonus", "hoa hồng", "brokerage",
                     "referral bonus", "giới thiệu", "referral", "affiliate", "cashback", "hoàn tiền",
                     "cash reward", "quà tặng", "gift voucher", "giải thưởng", "prize",
                     "competition prize", "giải nhất", "giải nhì", "giải ba", "xổ số", "trúng thưởng"],
            category="Tiền thưởng",
            transaction_type=TransactionType.INCOME,
            weight=30.0,
            priority=3,
        ))

        # Business
        self.add_rule(KeywordRule(
            keywords=["bán hàng", "kinh doanh", "doanh thu", "buôn bán", "business", "sale", "revenue",
                     "profit", "shop", "cửa hàng", "store", "online shop", "shop online",
                     "thương mại điện tử", "e-commerce", "tiki", "shopee", "lazada", "amazon",
                     "facebook shop", "instagram shop", "tiktok shop", "woocommerce", "shopify",
                     "doanh thu kinh doanh", "khởi nghiệp", "startup", "entrepreneur", "chủ doanh nghiệp",
                     "chủ shop", "dropship", "freelance", "freelancer", "side hustle",
                     "kinh doanh nhỏ", "small business", "quán", "quán cafe", "quán ăn", "nhà hàng",
                     "buôn bán", "trade", "wholesale", "bán sỉ", "bán lẻ", "retail",
                     "nhập hàng", "sản xuất", "manufacturing", "dịch vụ", "service", "consulting",
                     "tư vấn", "agency", "marketing agency", "quảng cáo", "advertising"],
            category="Kinh doanh",
            transaction_type=TransactionType.INCOME,
            weight=30.0,
            priority=3,
        ))

        # Uncategorized
        self.add_rule(KeywordRule(
            keywords=["khác", "linh tinh", "tổng", "chung", "misc", "gì", "chi phí",
                     "thu nhập", "không rõ"],
            category="Chưa phân loại",
            weight=5.0,
            priority=1,
        ))

    def add_rule(self, rule: KeywordRule) -> None:
        """Add a keyword rule."""
        self._rules.append(rule)

        # Build category index
        if rule.category not in self._category_index:
            self._category_index[rule.category] = []
        self._category_index[rule.category].append(rule)

        # Build keyword index
        for kw in rule.keywords:
            kw_lower = kw.lower()
            if kw_lower not in self._keyword_index:
                self._keyword_index[kw_lower] = []
            self._keyword_index[kw_lower].append(rule)

    def match(self, text: str) -> Dict[str, Tuple[float, List[str]]]:
        """
        Match keywords in text and return scores by category.

        Args:
            text: Input text (normalized)

        Returns:
            Dict mapping category -> (score, matched_keywords)
        """
        text_lower = text.lower()
        scores: Dict[str, Tuple[float, List[str]]] = {}

        for rule in self._rules:
            matched_keywords = []
            rule_score = 0.0

            for kw in rule.keywords:
                kw_lower = kw.lower()
                if kw_lower in text_lower:
                    matched_keywords.append(kw)
                    # Longer keywords = higher score
                    rule_score += rule.weight * (len(kw) / 5.0)

            if matched_keywords:
                # Apply position bonus
                for kw in matched_keywords:
                    pos = text_lower.find(kw.lower())
                    if pos == 0:
                        rule_score += ScoringWeights.POSITION_BONUS_START
                    elif pos < 15:
                        rule_score += ScoringWeights.POSITION_BONUS_EARLY

                if rule.category in scores:
                    existing_score, existing_kws = scores[rule.category]
                    scores[rule.category] = (
                        existing_score + rule_score,
                        existing_kws + matched_keywords
                    )
                else:
                    scores[rule.category] = (rule_score, matched_keywords)

        return scores

    def get_best_category(self, text: str) -> Tuple[str, TransactionType, float]:
        """
        Get the best matching category from keyword matching.

        Args:
            text: Input text

        Returns:
            Tuple of (category, transaction_type, score)
        """
        scores = self.match(text)

        if not scores:
            return ("Chưa phân loại", TransactionType.EXPENSE, 0.0)

        best_category = max(scores.items(), key=lambda x: x[1][0])
        category_name = best_category[0]
        score = best_category[1][0]

        # Get transaction type
        transaction_type = CATEGORY_TYPE.get(category_name, TransactionType.EXPENSE)

        return (category_name, transaction_type, score)

    def get_all_matches(self, text: str) -> List[Tuple[str, float, List[str]]]:
        """
        Get all keyword matches sorted by score.

        Args:
            text: Input text

        Returns:
            List of (category, score, matched_keywords) tuples
        """
        scores = self.match(text)
        results = [(cat, score, kws) for cat, (score, kws) in scores.items()]
        results.sort(key=lambda x: x[1], reverse=True)
        return results


# Global keyword matcher instance
keyword_matcher = KeywordMatcher()


def match_keywords(text: str) -> Dict[str, Tuple[float, List[str]]]:
    """Quick access to keyword matching."""
    return keyword_matcher.match(text)


def get_keyword_category(text: str) -> Tuple[str, TransactionType, float]:
    """Quick access to get best category from keywords."""
    return keyword_matcher.get_best_category(text)
