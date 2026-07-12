"""
Alias Dictionary Module
======================
Comprehensive alias mapping for Vietnamese transaction text.

Aliases normalize different spellings/variations of the same concept
to a canonical form for consistent matching.
"""

import re
from typing import Dict, List, Set, Tuple


class AliasDictionary:
    """
    Manages alias-to-canonical mappings for transaction classification.

    This module handles:
    - Different spellings of the same word
    - Typos and common mistakes
    - Short forms and abbreviations
    - Regional variations
    - English/Vietnamese equivalents
    """

    def __init__(self):
        """Initialize the alias dictionary."""
        self._aliases: Dict[str, str] = {}
        self._reverse_index: Dict[str, Set[str]] = {}
        self._pattern: re.Pattern = None
        self._build_aliases()

    def _build_aliases(self) -> None:
        """Build the complete alias dictionary."""

        # ============================================================
        # COFFEE & BEVERAGES
        # ============================================================
        coffee_aliases = [
            "cafe", "café", "cà phê", "càfe", "cf", "caphe",
            "coffee", "caffe", "caffè", "ca phe", "cà phê",
            "coffee shop", "quán cafe", "quán cà phê", "quán cf",
            "hiệu cafe", "tiệm cafe", "cửa hàng cafe",
        ]
        self._add_alias_group(coffee_aliases, "cafe")

        tea_aliases = [
            "tra sua", "trà sữa", "trasua", "trà sữa", "tra sua",
            "bubble tea", "milk tea", "che", "trà sữa trân châu",
            "tra chanh", "trà chanh", "tra dao", "trà đào",
            "tra olang", "trà ô long", "tra xanh", "trà xanh",
            "tra vai", "tra dua", "tra buoi", "tra gung",
        ]
        self._add_alias_group(tea_aliases, "tea")

        # ============================================================
        # FOOD TYPES
        # ============================================================
        food_aliases = [
            "an", "ăn", "uong", "uống", "nau", "nấu", "nấu ăn",
            "đi ăn", "đi uống", "đi nấu", "ra ngoài ăn", "ra quán",
            "buffet", "all you can eat", "ăn buffet", "buffet",
            "lẩu", "lau", "hotpot", "an lau", "nấu lẩu",
            "nuong", "nướng", "bbq", " barbecue", "ăn nướng",
            "hamburger", "burger", "hambe", "bánh burger",
            "pizza", "pizza hut", "domino", "pizza",
            "mì", "mi", "noodles", "hủ tiếu", "hủ tiếu", "phở",
            "pho", "bún", "bun", "cơm", "com", "rice",
        ]
        self._add_alias_group(food_aliases, "food")

        grocery_aliases = [
            "sieu thi", "siêu thị", "supermarket", "super market",
            "mart", "mini mart", "mini mart", "cửa hàng tiện lợi",
            "circle k", "circlek", "gs25", "familymart", "family mart",
            "vinmart", "winmart", "coopmart", "bigc", "aeon",
            "lotte mart", "lottemart", "mega mart", "makro",
            "market", "chợ", "cho", "wet market", "chợ truyền thống",
            "tạp hóa", "taphoa", "đại siêu thị", "grocery",
            "food mart", "fresh mart", "green mart",
        ]
        self._add_alias_group(grocery_aliases, "grocery")

        # ============================================================
        # TRANSPORT
        # ============================================================
        grab_aliases = [
            "grab", "grabcar", "grab bike", "grab xe may",
            "grab xe", "grab taxi", "grabtaxi", "grab food",
            "grabfood", "grab mart", "grabpay",
        ]
        self._add_alias_group(grab_aliases, "grab")

        taxi_aliases = [
            "taxi", "mai linh", "mailinh", "taxi group",
            "taxi xanh", "green taxi", "vinasun", "vinasun taxi",
            "uber", "uber x", "ube", "gojek", "be", "be app",
            "go ride", "go car", "go food", "go mart",
        ]
        self._add_alias_group(taxi_aliases, "taxi")

        fuel_aliases = [
            "xang", "xăng", "dau", "dầu", "nhien lieu", "nhiên liệu",
            "petrol", "gas", "fuel", "fuel station", "gas station",
            "petrol station", "trạm xăng", "cây xăng", "đổ xăng",
            "đổ dầu", "dầu nhờn", "dầu máy", "adblue",
            "shell", "petrovietnam", "pvoil", "caltex", "chevron",
            "esso", "total", "petro", "đảo xăng", "nhập xăng",
        ]
        self._add_alias_group(fuel_aliases, "fuel")

        parking_aliases = [
            "gui xe", "gửi xe", "do xe", "đỗ xe", "parking",
            "để xe", "trông xe", "giữ xe", "bãi đỗ xe",
            "car park", "parking lot", "car parking", "parking fee",
            "phi do xe", "phí đỗ xe", "phí giữ xe", "vé giữ xe",
        ]
        self._add_alias_group(parking_aliases, "parking")

        # ============================================================
        # SHOPPING
        # ============================================================
        shopee_aliases = [
            "shopee", "shopeefood", "shopee food", "shopee pay",
            "shopeepay", "shopee mart", "shopeemart",
        ]
        self._add_alias_group(shopee_aliases, "shopee")

        online_shop_aliases = [
            "lazada", "tiki", "amazon", "ebay", "sendo", "tiki",
            "lazada vn", "tiki vn", "shopee", "amazon vn",
            "mua online", "mua hang online", "đặt hàng online",
            "shopping online", "e-commerce", "ecommerce",
        ]
        self._add_alias_group(online_shop_aliases, "online_shopping")

        fashion_aliases = [
            "thoi trang", "thời trang", "fashion", "clothing",
            "apparel", "áo quần", "ao quan", "quần áo", "quan ao",
            "shop thoi trang", "cửa hàng thời trang", "fashion store",
        ]
        self._add_alias_group(fashion_aliases, "fashion")

        shoes_aliases = [
            "giay", "giày", "giày dép", "shoes", "footwear",
            "sandal", "sandals", "boots", " giày thể thao",
            "giay the thao", "sneakers", "running shoes",
        ]
        self._add_alias_group(shoes_aliases, "shoes")

        bag_aliases = [
            "tui xach", "túi xách", "balo", "backpack", "bag",
            "handbag", "shoulder bag", "túi đeo chéo", "túi tote",
            "wallet", "ví", "vi", "clutch", "purse",
        ]
        self._add_alias_group(bag_aliases, "bag")

        jewelry_aliases = [
            "trang suc", "trang sức", "jewelry", "jewellery",
            "nhan", "nhẫn", "vong", "vòng", "lắc", "lắc tay",
            "dây chuyền", "day chuyen", "bông tai", "bông tay",
            "khuyên", "khuyên tai", "accessories", "phụ kiện",
        ]
        self._add_alias_group(jewelry_aliases, "jewelry")

        electronics_aliases = [
            "dien thoai", "điện thoại", "smartphone", "phone", "dt",
            "iphone", "samsung", "xiaomi", "oppo", "vivo", "nokia",
            "realme", "poco", "laptop", "máy tính", "máy tính xách tay",
            "computer", "pc", "macbook", "imac", "ipad", "tablet",
            "camera", "máy ảnh", "webcam", "security camera",
        ]
        self._add_alias_group(electronics_aliases, "electronics")

        # ============================================================
        # ENTERTAINMENT
        # ============================================================
        cinema_aliases = [
            "cgv", "cgv cinema", "bhd", "bhd cinema", "galaxy",
            "galaxy cinema", "lotte cinema", "cinestar", "mega gs",
            "rap chieu", "rạp chiếu", "rạp phim", "rap phim",
            "cinema", "movie theater", "movie", "xem phim",
            "mua vé phim", "đặt vé phim", "vé xem phim",
        ]
        self._add_alias_group(cinema_aliases, "cinema")

        streaming_aliases = [
            "netflix", "spotify", "youtube premium", "youtube vip",
            "disney plus", "disney+", "prime video", "apple tv",
            "hbo", "hbo max", "spotify premium", "youtube music",
            "apple music", "tidal", "deezer", "zing mp3", "nhaccuatui",
            "spotify", "netflix", "watch", "xem phim online",
            "phim online", "phim lẻ", "phim bộ", "phim truyện",
        ]
        self._add_alias_group(streaming_aliases, "streaming")

        gaming_aliases = [
            "game", "games", "chơi game", "gaming", "playstation",
            "ps5", "ps4", "ps3", "xbox", "xbox series x", "switch",
            "nintendo", "nintendo switch", "steam", "epic games",
            "garena", "riot", "valorant", "lol", "genshin",
            "pubg", "free fire", "minecraft", "roblox",
            "console", "handheld", "game console", "gamepad",
        ]
        self._add_alias_group(gaming_aliases, "gaming")

        karaoke_aliases = [
            "karaoke", "hát", "hat", "ca hat", "ca hát", "sing",
            "sing along", "quán hát", "phòng hát", "phòng karaoke",
        ]
        self._add_alias_group(karaoke_aliases, "karaoke")

        concert_aliases = [
            "concert", "show", "biểu diễn", "sự kiện", "event",
            "ticket", "vé", "ve", "vé concert", " vé sự kiện",
            "mua vé", "đặt vé", "livestream", "live show",
        ]
        self._add_alias_group(concert_aliases, "concert")

        # ============================================================
        # HEALTH & BEAUTY
        # ============================================================
        hospital_aliases = [
            "benh vien", "bệnh viện", "bv", "hospital", "hospital",
            "phong kham", "phòng khám", "clinic", "medical center",
            "trung tâm y tế", "y tế", "bác sĩ", "bs", "bs.",
            "khám bệnh", "checkup", "medical", "healthcare",
        ]
        self._add_alias_group(hospital_aliases, "hospital")

        pharmacy_aliases = [
            "thuoc", "thuốc", "drug", "medicine", "medications",
            "nhà thuốc", "nha thuoc", "pharmacy", "drugstore",
            "quầy thuốc", "shop thuốc", "thuốc men", "thuốc bổ",
            "vitamin", "thực phẩm chức năng", "tpcn", "supplement",
        ]
        self._add_alias_group(pharmacy_aliases, "pharmacy")

        spa_aliases = [
            "spa", "massage", "masage", "massage spa", "spa massage",
            "mát xa", "mat xa", "xông hơi", "sauna", "spa",
            "body massage", "foot massage", "massage chân", "massage mặt",
        ]
        self._add_alias_group(spa_aliases, "spa")

        salon_aliases = [
            "salon", "lam toc", "làm tóc", "cat toc", "cắt tóc",
            "nhuộm tóc", "nhuom toc", "uốn tóc", "uon toc",
            "gội đầu", "goi dau", "makeup", "trang điểm", "làm đẹp",
            "beauty salon", "hair salon", "nail", "nail salon",
            "làm móng", "làm mặt", "facial", "skincare",
        ]
        self._add_alias_group(salon_aliases, "salon")

        gym_aliases = [
            "gym", "fitness", "phòng gym", "phong gym", "tap gym",
            "tập gym", "vô gym", "vo gym", "workout", "exercise",
            "fitness center", "thể dục", "the duc", "thể hình",
            "bodybuilding", "crossfit", "yoga", "pilates", "pt",
            "personal trainer", "huấn luyện viên", "hlv", "club gym",
        ]
        self._add_alias_group(gym_aliases, "gym")

        # ============================================================
        # HOME & UTILITIES
        # ============================================================
        rent_aliases = [
            "thue nha", "thuê nhà", "tiền thuê", "tien thue",
            "rent", "rental", "lease", "nhà trọ", "nha tro",
            "phòng trọ", "phong tro", "trọ", "tro", "cho thuê",
            "mướn", "mướn nhà", "ở trọ", "ở nhà thuê",
        ]
        self._add_alias_group(rent_aliases, "rent")

        utilities_aliases = [
            "dien", "điện", "nuoc", "nước", "internet", "wifi",
            "mang", "mạng", "gas", "ga", "bếp ga", "bep ga",
            "utilities", "hoa don", "hóa đơn", "bill", "tiền điện",
            "tiền nước", "tiền internet", "cước điện thoại",
            "evn", "viettel", "vnpt", "fpt", "mobifone",
        ]
        self._add_alias_group(utilities_aliases, "utilities")

        furniture_aliases = [
            "noi that", "nội thất", "furniture", "furnishing",
            "bed", "sofa", "bàn", "ghế", "tủ", "shelf", "rack",
            "cây", "cây cảnh", "decor", "trang trí", "interior",
            "thiết kế nội thất", "nha dep", "nhà đẹp",
        ]
        self._add_alias_group(furniture_aliases, "furniture")

        # ============================================================
        # TRAVEL
        # ============================================================
        hotel_aliases = [
            "khach san", "khách sạn", "hotel", "resort", "homestay",
            "hostel", "motel", "airbnb", "booking", "agoda",
            "booking.com", "traveloka", "vnbooking", "resort",
            "phòng khách sạn", "phong ks", "phòng hotel",
            "thuê phòng", "thue phong", "thuê khách sạn",
        ]
        self._add_alias_group(hotel_aliases, "hotel")

        flight_aliases = [
            "may bay", "máy bay", "ve may bay", "vé máy bay",
            "airplane", "flight", "airline", "hàng không",
            "vietnam airline", "vietjet", "jetstar", "bamboo airways",
            "book vé máy bay", "đặt vé", "mua vé máy bay",
            "airport", "sân bay", "san bay", " vé máy bay",
            "fly", "boarding pass", "boarding",
        ]
        self._add_alias_group(flight_aliases, "flight")

        travel_aliases = [
            "du lich", "du lịch", "travel", "vacation", "trip",
            "tour", "biển", "bien", "núi", "bãi biển", "beach",
            "island", "đảo", "islands", "trekking", "camping",
            "dã ngoại", "leisure", "nghỉ dưỡng", "nghi duong",
        ]
        self._add_alias_group(travel_aliases, "travel")

        # ============================================================
        # INCOME
        # ============================================================
        salary_aliases = [
            "luong", "lương", "lĩnh lương", "nhận lương", "lĩnh lương",
            "salary", "wage", "pay", "paycheck", "payroll",
            "lương tháng", "lương tuần", "lương ngày", "payday",
            "thu nhập", "income", "lương cứng", "lương net",
            "lương gross", "lương cơ bản", "lương thử việc",
        ]
        self._add_alias_group(salary_aliases, "salary")

        investment_aliases = [
            "dau tu", "đầu tư", "invest", "investment", "investing",
            "chung khoan", "chứng kỹ", "cổ phiếu", "co phieu",
            "stock", "shares", "bond", "quỹ", "mutual fund", "etf",
            "crypto", "bitcoin", "forex", "gold", "vàng",
            "lãi", "lai", "interest", "profit", "return", "roi",
        ]
        self._add_alias_group(investment_aliases, "investment")

        business_aliases = [
            "kinh doanh", "business", "doanh thu", "revenue",
            "buon ban", "buôn bán", "ban hang", "bán hàng",
            "shop", "cửa hàng", "store", "entrepreneur", "startup",
            "online shop", "shop online", "bán online", "freelance",
            "freelancer", "dịch vụ", "service", "consulting",
        ]
        self._add_alias_group(business_aliases, "business")

        bonus_aliases = [
            "thuong", "thưởng", "bonus", "reward", "prize", "award",
            "thưởng tháng", "thưởng quý", "thưởng năm", "thưởng tết",
            "performance bonus", "sales bonus", "year-end bonus",
            "li xi", "lì xì", "lixi", "gift", "quà", "qua",
            "hoa hong", "hoa hồng", "commission", "cashback",
            "hoàn tiền", "hoan tien", "refund", "giải thưởng",
            "trúng thưởng", "trung thuong", "jackpot", "lottery",
        ]
        self._add_alias_group(bonus_aliases, "bonus")

        # ============================================================
        # MISC
        # ============================================================
        pet_aliases = [
            "thu cung", "thú cưng", "pet", "pets", "cho", "meo",
            "cá", "chim", "pet shop", "pet store", "veterinary",
            "thú y", "thu y", "clinic thú y", "pet care", "pet food",
            "đồ cho pet", "thức ăn cho pet", "thuốc cho pet",
        ]
        self._add_alias_group(pet_aliases, "pet")

        education_aliases = [
            "hoc phi", "học phí", "sach", "sách", "khoa hoc", "khóa học",
            "school", "university", "university", "college", "course",
            "book", "textbook", "elearning", "học online", "udemy",
            "coursera", "edx", "ielts", "toeic", "sat", "gre", "gmat",
            "tiếng anh", "tiếng trung", "tiếng nhật", "tiếng hàn",
            "guitar", "piano", "vẽ", "học", "giáo dục", "education",
        ]
        self._add_alias_group(education_aliases, "education")

        # Build the regex pattern for efficient matching
        self._build_pattern()

    def _add_alias_group(self, aliases: List[str], canonical: str) -> None:
        """
        Add a group of aliases that map to a canonical form.

        Args:
            aliases: List of alias strings
            canonical: The canonical form to map to
        """
        for alias in aliases:
            self._aliases[alias.lower()] = canonical

        if canonical not in self._reverse_index:
            self._reverse_index[canonical] = set()
        for alias in aliases:
            self._reverse_index[canonical].add(alias.lower())

    def _build_pattern(self) -> None:
        """Build regex pattern for all aliases."""
        # Sort by length descending to match longer patterns first
        sorted_aliases = sorted(self._aliases.keys(), key=len, reverse=True)
        pattern = r'\b(' + '|'.join(re.escape(a) for a in sorted_aliases) + r')\b'
        self._pattern = re.compile(pattern, re.IGNORECASE)

    def get_canonical(self, text: str) -> str:
        """
        Get canonical form from alias.

        Args:
            text: Text to lookup

        Returns:
            Canonical form or original text if no alias found
        """
        normalized = text.lower().strip()
        return self._aliases.get(normalized, text)

    def resolve(self, text: str) -> str:
        """
        Resolve all aliases in text to canonical forms.

        Args:
            text: Text to resolve

        Returns:
            Text with aliases resolved
        """
        return self._pattern.sub(
            lambda m: self._aliases.get(m.group().lower(), m.group()),
            text
        )

    def get_aliases_for(self, canonical: str) -> Set[str]:
        """
        Get all aliases for a canonical form.

        Args:
            canonical: Canonical form

        Returns:
            Set of alias strings
        """
        return self._reverse_index.get(canonical, set())

    def lookup(self, text: str) -> Tuple[str, bool]:
        """
        Lookup alias in text.

        Args:
            text: Text to lookup

        Returns:
            Tuple of (canonical, found)
        """
        normalized = text.lower().strip()
        found = normalized in self._aliases
        return (self._aliases.get(normalized, text), found)


# Global alias dictionary instance
alias_dict = AliasDictionary()


def resolve_aliases(text: str) -> str:
    """Quick access to alias resolution."""
    return alias_dict.resolve(text)


def get_canonical(alias: str) -> str:
    """Quick access to get canonical form."""
    return alias_dict.get_canonical(alias)
