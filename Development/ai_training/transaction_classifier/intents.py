"""
Intent Detection Module
====================
Detects user intent from transaction text.

Intent is the primary action or purpose of the transaction.
This is combined with context (merchant, keywords) to determine category.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from enum import Enum


class Intent(str, Enum):
    """
    Intent types for transaction classification.

    Intents are the primary actions users take:
    - BUY: Purchasing goods or services
    - FOOD: Eating/drinking
    - TRANSPORT: Transportation-related expenses
    - PAY: Payment for bills, subscriptions
    - TRANSFER: Money transfers
    - INCOME: Money coming in
    - SUBSCRIPTION: Recurring payments
    - HEALTH: Health-related expenses
    - ENTERTAINMENT: Leisure activities
    - HOME: Home-related expenses
    - TRAVEL: Travel-related expenses
    - EDUCATION: Learning expenses
    - INVEST: Investment/ savings
    - UNKNOWN: Cannot determine
    """
    BUY = "buy"                   # Purchasing
    FOOD = "food"                 # Eating/ drinking
    TRANSPORT = "transport"        # Transportation
    PAY = "pay"                   # Payment (bills)
    TRANSFER = "transfer"          # Money transfer
    INCOME = "income"              # Money received
    SUBSCRIPTION = "subscription"  # Recurring payments
    HEALTH = "health"             # Health expenses
    ENTERTAINMENT = "entertainment"  # Entertainment
    HOME = "home"                 # Home expenses
    TRAVEL = "travel"             # Travel
    EDUCATION = "education"        # Learning
    INVEST = "invest"             # Investment
    PARK = "park"                 # Parking
    SERVICE = "service"           # Services
    PET = "pet"                   # Pet-related
    BEAUTY = "beauty"             # Beauty/grooming
    SPORTS = "sports"             # Sports/fitness
    UNKNOWN = "unknown"           # Cannot determine


@dataclass
class IntentInfo:
    """
    Intent information with metadata.

    Attributes:
        intent: The Intent enum value
        confidence: Confidence score (0-1)
        matched_keywords: List of keywords that matched
        position: Position in text where intent was detected
    """
    intent: Intent
    confidence: float
    matched_keywords: List[str] = field(default_factory=list)
    position: int = 0


class IntentDetector:
    """
    Detects user intent from transaction text.

    Intent detection is crucial for context-based classification:
    - "mua đồ ở royal city" → BUY intent → Shopping category
    - "ăn ở royal city" → FOOD intent → Food category
    - "xem phim royal city" → ENTERTAINMENT intent → Entertainment category
    """

    def __init__(self):
        """Initialize the intent detector."""
        self._intents: Dict[Intent, List[str]] = {}
        self._pattern: Optional[re.Pattern] = None
        self._build_intents()
        self._build_pattern()

    def _build_intents(self) -> None:
        """Build the complete intent dictionary."""

        # ============================================================
        # BUY INTENT - Purchasing goods
        # ============================================================
        self._intents[Intent.BUY] = [
            # Vietnamese
            "mua", "mua sam", "mua sắm", "đi mua", "ra mua", "order", "đặt hàng",
            "đặt", "ship", "ship hàng", "sắm", "tậu", "rước", "mua về", "mua vào",
            "trả tiền", "thanh toán", "chi", "chi tiêu", "tiêu", "tiêu xài",
            "shopping", "shop", "shop online", "mua online", "đặt mua", "order",
            # English
            "buy", "purchase", "shop", "shopping", "order", "checkout", "pay for",
        ]

        # ============================================================
        # FOOD INTENT - Eating/ drinking
        # ============================================================
        self._intents[Intent.FOOD] = [
            # Vietnamese
            "ăn", "uống", "đi ăn", "đi uống", "ra ăn", "ra uống", "vô ăn", "vô uống",
            "nhậu", "nhậu nhẹt", "nhậu bia", "làm cơm", "nấu cơm", "nấu ăn",
            "cafe", "cà phê", "coffee", "uống cafe", "ăn sáng", "ăn trưa", "ăn tối",
            "buffet", "ăn buffet", "lẩu", "nướng", "hàn huyên", "họp mặt",
            "đi ăn", "ra quán", "vô quán", "ở quán", "ngồi ăn", "gọi món",
            # English
            "eat", "drink", "dinner", "lunch", "breakfast", "brunch", "snack",
            "have lunch", "have dinner", "have breakfast", "meal", "ordering",
        ]

        # ============================================================
        # TRANSPORT INTENT - Transportation
        # ============================================================
        self._intents[Intent.TRANSPORT] = [
            # Vietnamese
            "đi", "đi xe", "di xe", "đi taxi", "đi grab", "đi uber", "đi be",
            "xe máy", "xe may", "ô tô", "oto", "ô tô", "chạy", "chạy xe",
            "lái xe", "lai xe", "bắt xe", "bắt taxi", "gọi xe", "đặt xe",
            "đổ xăng", "đổ dầu", "nạp xăng", "nạp nhiên liệu", "bơm xăng",
            "sửa xe", "thay nhớt", "thay dầu", "bảo dưỡng xe", "bảo trì xe",
            "bảo hiểm xe", "đăng kiểm", "ra biển", "làm biển", "mua xe",
            # English
            "drive", "driving", "taxi", "uber", "grab", "ride", "car", "bike",
            "fuel", "gas", "petrol", "fill up", "refuel", "maintenance",
        ]

        # ============================================================
        # PARK INTENT - Parking
        # ============================================================
        self._intents[Intent.PARK] = [
            # Vietnamese
            "gửi xe", "gui xe", "đỗ xe", "do xe", "parking", "trông xe", "giữ xe",
            "để xe", "ra xe", "vô xe", "lấy xe", "gửi xe máy", "gửi ô tô",
            "phí gửi xe", "phí đỗ xe", "vé gửi xe", "vé đỗ xe", "parking fee",
            # English
            "park", "parking", "valet", "parking lot", "car park",
        ]

        # ============================================================
        # PAY INTENT - Bill payment
        # ============================================================
        self._intents[Intent.PAY] = [
            # Vietnamese
            "trả", "tra", "thanh toán", "thanh toán", "đóng", "dong", "đóng tiền",
            "trả tiền", "tra tien", "nạp", "nap", "nạp tiền", "trả tiền",
            "trả hóa đơn", "trả bill", "trả bill", "pay bill", "billing",
            "trả phí", "trả phí dịch vụ", "trả cước", "cước điện thoại",
            "trả tiền điện", "trả tiền nước", "trả tiền internet", "trả wifi",
            "trả tiền nhà", "trả tiền thuê", "trả tiền thuê nhà",
            # English
            "pay", "payment", "pay bill", "pay fee", "pay charge", "pay subscription",
            "pay rent", "pay electricity", "pay water", "pay internet", "pay online",
        ]

        # ============================================================
        # TRANSFER INTENT - Money transfer
        # ============================================================
        self._intents[Intent.TRANSFER] = [
            # Vietnamese
            "chuyển khoản", "chuyen khoan", "chuyển tiền", "chuyen tien", "gửi tiền",
            "gui tien", "gửi", "gui", "rút tiền", "rut tien", "rút",
            "nạp tiền", "nap tien", "nạp bank", "nạp ví", "rút tiền ATM",
            "chuyển tiền cho", "gửi tiền cho", "transfer", "ví điện tử",
            "banking", "internet banking", "mobile banking", "app banking",
            # English
            "transfer", "send money", "receive money", "wire", "remit", "deposit",
        ]

        # ============================================================
        # INCOME INTENT - Money received
        # ============================================================
        self._intents[Intent.INCOME] = [
            # Vietnamese
            "nhận", "nhan", "được", "duoc", "thu", "thu nhập", "kiếm được",
            "được lương", "được tiền", "được thưởng", "được trả", "được chi",
            "lĩnh lương", "lĩnh", "nhận lương", "lĩnh lương", "rút lương",
            "thu tiền", "thu", "thuê", "cho thuê", "bán được", "lời",
            "lãi", "lai", "cổ tức", "co tuc", "hoàn tiền", "hoan tien",
            # English
            "receive", "get", "earn", "income", "salary", "wage", "bonus",
            "profit", "gain", "return", "dividend", "refund", "cashback",
        ]

        # ============================================================
        # SUBSCRIPTION INTENT - Recurring payments
        # ============================================================
        self._intents[Intent.SUBSCRIPTION] = [
            # Vietnamese
            "thuê bao", "thue bao", "đăng ký", "dang ky", "subscribe", "subscription",
            "thuê bao tháng", "thanh toán tháng", "hàng tháng", "hang thang",
            "gia hạn", "gia han", "renew", "gia hạn thuê bao", "trả tháng",
            "trả năm", "yearly", "monthly", "annual", "subscription fee",
            # English
            "subscribe", "subscription", "membership", "premium", "monthly fee",
            "annual fee", "yearly fee", "recurring", "auto-renew", "renewal",
        ]

        # ============================================================
        # HEALTH INTENT - Health expenses
        # ============================================================
        self._intents[Intent.HEALTH] = [
            # Vietnamese
            "khám", "kham", "bệnh", "benh", "bệnh viện", "benh vien", "bv",
            "phòng khám", "phong kham", "bác sĩ", "bs", "bs.", "y sĩ",
            "thuốc", "thuoc", "dược", "duoc", "nhà thuốc", "nha thuoc",
            "khám bệnh", "xét nghiệm", "xet nghiem", "siêu âm", "sieu am",
            "chụp X-quang", "chup X-quang", "MRI", "CT scan", "mổ", "mo",
            "phẫu thuật", "phau thuat", "tiêm", "tiem", "tiêm phòng",
            "vaccine", "vacxin", "bảo hiểm y tế", "bhyt", "bảo hiểm",
            "nha khoa", "nhổ răng", "nhổ", "răng", "rang", "niềng răng",
            "kính mắt", "kinh mat", "mắt", "mat", "bệnh viện mắt",
            # English
            "hospital", "clinic", "doctor", "medical", "medicine", "pharmacy",
            "health", "healthcare", "checkup", "examination", "treatment",
            "surgery", "dental", "dentist", "eye", "optical", "glasses",
        ]

        # ============================================================
        # ENTERTAINMENT INTENT - Entertainment
        # ============================================================
        self._intents[Intent.ENTERTAINMENT] = [
            # Vietnamese
            "xem", "xem phim", "xem phim", "chiếu phim", "chieu phim", "đi xem phim",
            "hát", "hat", "ca hát", "ca hat", "karaoke", "sing", "sing along",
            "chơi", "choi", "chơi game", "choi game", "gaming", "game",
            "nghe nhạc", "nghe nhac", "nhạc", "nhac", "concert", "show",
            "sự kiện", "su kien", "event", "livestream", "live",
            "netflix", "spotify", "youtube", "zalo", "facebook", "tiktok",
            "mua vé", "mua ve", "vé", "ve", " vé xem", "đặt vé",
            # English
            "watch", "movie", "cinema", "film", "concert", "show", "event",
            "game", "gaming", "play", "music", "concert", "ticket",
            "netflix", "spotify", "youtube", "streaming", "live",
        ]

        # ============================================================
        # HOME INTENT - Home expenses
        # ============================================================
        self._intents[Intent.HOME] = [
            # Vietnamese
            "thuê nhà", "thue nha", "tiền nhà", "tiền thuê", "nhà", "nha",
            "điện", "dien", "nước", "nuoc", "internet", "wifi", "mạng", "mang",
            "gas", "ga", "bếp ga", "bep ga", "cước", "cuoc", "cước điện thoại",
            "sửa nhà", "sua nha", "sửa chữa", "sua chua", "bảo trì", "bao tri",
            "trang trí", "trang tri", "nội thất", "noi that", "furniture",
            "tiền điện", "tiền nước", "tiền internet", "tiền wifi",
            "phí quản lý", "phí dịch vụ", "phí bảo vệ", "phí giữ xe",
            "đặt cọc", "đat coc", "cọc", "coc",
            # English
            "rent", "electricity", "water", "internet", "wifi", "gas", "utility",
            "home", "house", "apartment", "maintenance", "repair", "renovation",
            "furniture", "decoration", "utility bill", "household",
        ]

        # ============================================================
        # TRAVEL INTENT - Travel
        # ============================================================
        self._intents[Intent.TRAVEL] = [
            # Vietnamese
            "du lịch", "du lich", "travel", "vacation", "nghỉ mát", "nghi mat",
            "tour", "đi tour", "khách sạn", "khach san", "hotel", "resort",
            "homestay", "hostel", "airbnb", "máy bay", "may bay", "vé máy bay",
            "tàu", "tau", "xe khách", "xe khoach", "cruise", "biển", "bien",
            "đảo", "dao", "núi", "nui", "cắm trại", "cam tria", "camping",
            "trekking", "leo núi", "leo nui", "bãi biển", "beach",
            "đặt phòng", "dat phong", "booking", "check-in", "check-out",
            # English
            "travel", "trip", "vacation", "holiday", "tour", "hotel", "flight",
            "airplane", "train", "bus", "cruise", "beach", "mountain", "camping",
            "trekking", "hiking", "booking", "reservation", "accommodation",
        ]

        # ============================================================
        # EDUCATION INTENT - Learning
        # ============================================================
        self._intents[Intent.EDUCATION] = [
            # Vietnamese
            "học", "hoc", "học phí", "hoc phi", "học tiền", "trường", "truong",
            "lớp", "lop", "khóa học", "khoa hoc", "course", "sách", "sach",
            "vở", "vo", "bút", "but", "dụng cụ học tập", "dung cu hoc tap",
            "gia sư", "gia su", "gia sư", "học thêm", "hoc them", "học kèm",
            "tiếng anh", "tieng anh", "toeic", "ielts", "sat", "gre", "gmat",
            "đại học", "dai hoc", "đh", "dh", "cao đẳng", "cao dang",
            "thạc sĩ", "thac si", "tiến sĩ", "tien si", "bằng", "bang",
            # English
            "school", "university", "college", "course", "education", "learning",
            "study", "tuition", "fee", "book", "textbook", "stationery",
            "tutoring", "training", "seminar", "workshop", "certification",
        ]

        # ============================================================
        # INVEST INTENT - Investment/ savings
        # ============================================================
        self._intents[Intent.INVEST] = [
            # Vietnamese
            "đầu tư", "dau tu", "đầu tư", "invest", "chứng khoán", "chung khoan",
            "cổ phiếu", "co phieu", "trái phiếu", "trai phieu", "quỹ", "quy",
            "vàng", "vang", "gold", "crypto", "bitcoin", "ethereum", "forex",
            "bất động sản", "bat dong san", "nhà đất", "nha dat", "đất",
            "gửi tiết kiệm", "gui tiet kiem", "tiết kiệm", "tiet kiem",
            "tiền gửi", "tien gui", "kỳ hạn", "ky han", "lãi suất", "lai suat",
            "lãi", "lai", "cổ tức", "co tuc", "dividend", "profit",
            # English
            "invest", "investment", "stock", "share", "bond", "fund", "gold",
            "crypto", "bitcoin", "ethereum", "real estate", "property",
            "savings", "deposit", "interest", "dividend", "profit", "return",
        ]

        # ============================================================
        # PET INTENT - Pet-related
        # ============================================================
        self._intents[Intent.PET] = [
            # Vietnamese
            "thú cưng", "thu cung", "pet", "cho", "meo", "cá", "ca", "chim",
            "pet shop", "thức ăn cho pet", "thuoc cho pet", "thuốc cho pet",
            "tiêm pet", "tắm pet", "thú y", "thu y", "veterinary", "clinic thú y",
            "đồ chơi cho pet", "pet care", "pet food", "pet toy", "pet supply",
            # English
            "pet", "dog", "cat", "fish", "bird", "pet shop", "veterinary",
            "pet food", "pet care", "pet toy", "pet supplies", "grooming",
        ]

        # ============================================================
        # BEAUTY INTENT - Beauty/ grooming
        # ============================================================
        self._intents[Intent.BEAUTY] = [
            # Vietnamese
            "làm đẹp", "lam dep", "lam dep", "spa", "massage", "mát xa", "mat xa",
            "làm tóc", "lam toc", "cắt tóc", "cat toc", "nhuộm tóc", "nhuom toc",
            "uốn tóc", "uon toc", "gội đầu", "goi dau", "makeup", "trang điểm",
            "son", "kem", "mỹ phẩm", "my pham", "dưỡng da", "duong da",
            "skincare", "làm móng", "lam mong", "nail", "làm mặt", "lam mat",
            "facial", "wax", "cạo râu", "cao râu", "tẩy lông", "tay long",
            # English
            "beauty", "spa", "massage", "hair", "haircut", "hair salon",
            "makeup", "cosmetics", "skincare", "nail", "facial", "grooming",
        ]

        # ============================================================
        # SPORTS INTENT - Sports/ fitness
        # ============================================================
        self._intents[Intent.SPORTS] = [
            # Vietnamese
            "gym", "fitness", "tập gym", "tap gym", "phòng gym", "phong gym",
            "vô gym", "vo gym", "thể dục", "the duc", "thể hình", "the hinh",
            "workout", "exercise", "chạy", "chay", "bơi", "boi", "bơi lội",
            "yoga", "pilates", " aerobic", "fitness center", "gym center",
            "cầu lông", "cau long", "bóng đá", "bong da", "bóng rổ", "bong ro",
            "tennis", "bida", "leo núi", "hiking", "marathon", "chạy bộ",
            "đạp xe", "dap xe", "cycling", "xe đạp", "xe dap", "bike",
            "mua giày", "mua giay", "giày thể thao", "giay the thao",
            # English
            "gym", "fitness", "workout", "exercise", "sports", "running",
            "swimming", "yoga", "pilates", "cycling", "hiking", "marathon",
            "football", "soccer", "basketball", "tennis", "badminton",
        ]

        # ============================================================
        # SERVICE INTENT - Services
        # ============================================================
        self._intents[Intent.SERVICE] = [
            # Vietnamese
            "sửa", "sua", "sửa chữa", "sua chua", "bảo trì", "bao tri",
            "bảo dưỡng", "bao duong", "sửa điện thoại", "sửa laptop",
            "sửa máy tính", "fix", "repair", "maintenance",
            "cleaning", "dọn dẹp", "don dep", "giặt", "giat", "giặt là",
            "rửa xe", "rua xe", "wash", "cắt tóc", "cat toc", "grooming",
            "nail", "làm móng", "photography", "chụp ảnh", "chup anh",
            # English
            "service", "repair", "fix", "maintenance", "fixing", "fixer",
            "cleaning", "laundry", "wash", "grooming", "photography",
        ]

    def _build_pattern(self) -> None:
        """Build regex pattern for efficient matching."""
        all_keywords = []
        for intent, keywords in self._intents.items():
            for kw in keywords:
                all_keywords.append((kw, intent))

        # Sort by length descending
        all_keywords.sort(key=lambda x: len(x[0]), reverse=True)

        # Build pattern
        pattern_parts = []
        for kw, intent in all_keywords:
            # Escape special regex characters
            escaped = re.escape(kw)
            pattern_parts.append(escaped)

        pattern = r'\b(' + '|'.join(pattern_parts) + r')\b'
        self._pattern = re.compile(pattern, re.IGNORECASE)

    def detect(self, text: str) -> List[IntentInfo]:
        """
        Detect intents from text.

        Args:
            text: Input text

        Returns:
            List of IntentInfo objects, sorted by confidence
        """
        text_lower = text.lower()
        intent_scores: Dict[Intent, Tuple[float, List[str], int]] = {}

        for intent, keywords in self._intents.items():
            best_match_len = 0
            matched = []
            first_position = len(text)

            for kw in keywords:
                if kw.lower() in text_lower:
                    matched.append(kw)
                    if len(kw) > best_match_len:
                        best_match_len = len(kw)
                    pos = text_lower.find(kw.lower())
                    if pos < first_position:
                        first_position = pos

            if matched:
                # Calculate confidence based on match quality
                # More keywords = higher confidence
                keyword_score = min(len(matched) / 3.0, 1.0)  # Cap at 1.0
                # Longer matches = higher confidence
                length_score = min(best_match_len / 10.0, 1.0)  # Cap at 1.0
                # Early position = higher confidence
                position_score = 1.0 - (first_position / len(text)) if len(text) > 0 else 0

                confidence = (keyword_score * 0.4 + length_score * 0.3 + position_score * 0.3)
                intent_scores[intent] = (confidence, matched, first_position)

        # Convert to IntentInfo list and sort by confidence
        results = [
            IntentInfo(intent=intent, confidence=score, matched_keywords=matched, position=pos)
            for intent, (score, matched, pos) in intent_scores.items()
        ]
        results.sort(key=lambda x: x.confidence, reverse=True)

        return results

    def get_primary_intent(self, text: str) -> IntentInfo:
        """
        Get the primary (highest confidence) intent.

        Args:
            text: Input text

        Returns:
            IntentInfo with highest confidence, or UNKNOWN if no intent found
        """
        intents = self.detect(text)
        if intents:
            return intents[0]
        return IntentInfo(intent=Intent.UNKNOWN, confidence=0.0, matched_keywords=[])

    def get_all_intents(self, text: str) -> Set[Intent]:
        """
        Get all detected intents from text.

        Args:
            text: Input text

        Returns:
            Set of detected Intent values
        """
        intents = self.detect(text)
        return {info.intent for info in intents}

    def is_income_intent(self, text: str) -> bool:
        """Check if text contains income-related intent."""
        intents = self.detect(text)
        income_intents = {Intent.INCOME, Intent.INVEST}
        return any(info.intent in income_intents for info in intents)

    def is_expense_intent(self, text: str) -> bool:
        """Check if text contains expense-related intent."""
        intents = self.detect(text)
        expense_intents = {
            Intent.BUY, Intent.FOOD, Intent.TRANSPORT, Intent.PAY,
            Intent.SUBSCRIPTION, Intent.HEALTH, Intent.ENTERTAINMENT,
            Intent.HOME, Intent.TRAVEL, Intent.EDUCATION, Intent.PARK,
            Intent.SERVICE, Intent.PET, Intent.BEAUTY, Intent.SPORTS
        }
        return any(info.intent in expense_intents for info in intents)


# Global intent detector instance
intent_detector = IntentDetector()


def detect_intent(text: str) -> List[IntentInfo]:
    """Quick access to intent detection."""
    return intent_detector.detect(text)


def get_primary_intent(text: str) -> IntentInfo:
    """Quick access to primary intent."""
    return intent_detector.get_primary_intent(text)


def get_all_intents(text: str) -> Set[Intent]:
    """Quick access to all intents."""
    return intent_detector.get_all_intents(text)
