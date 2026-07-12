"""
Merchant Database Module
======================
Comprehensive merchant database with location attributes.

IMPORTANT: Merchants do NOT directly determine category.
They provide CONTEXT for the context rule engine to make decisions.

Example:
- "mua đồ ở royal city" → Shopping (BUY + Mall)
- "ăn ở royal city" → Food (FOOD + Mall)
- "xem phim royal city" → Entertainment (WATCH + Mall)
- "gửi xe royal city" → Transport (PARK + Mall)
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from enum import Enum


class LocationType(str, Enum):
    """
    Location type classification.
    This helps the context engine understand the type of place.
    """
    MALL = "mall"           # Shopping malls
    RESTAURANT = "restaurant"  # Food & beverage
    STREET = "street"        # Street food / sidewalk
    HOTEL = "hotel"         # Hotels & accommodation
    CINEMA = "cinema"        # Movie theaters
    STADIUM = "stadium"     # Sports venues
    PARK = "park"           # Parks & public spaces
    GAS_STATION = "gas_station"  # Gas stations
    SUPERMARKET = "supermarket"  # Grocery stores
    CONVENIENCE = "convenience"  # Convenience stores
    OFFICE = "office"       # Office buildings
    HOME = "home"           # Home
    UNKNOWN = "unknown"     # Unknown location


@dataclass
class Merchant:
    """
    Merchant entity with metadata.

    Attributes:
        name: Display name of the merchant
        aliases: Alternative names/spellings
        location_type: Type of location (MALL, RESTAURANT, etc.)
        possible_categories: Categories this merchant is commonly associated with
                            (NOT deterministic - used for context scoring)
        brand: Brand name if applicable
        keywords: Additional matching keywords
    """
    name: str
    aliases: List[str] = field(default_factory=list)
    location_type: LocationType = LocationType.UNKNOWN
    possible_categories: List[str] = field(default_factory=list)
    brand: Optional[str] = None
    keywords: List[str] = field(default_factory=list)

    def __post_init__(self):
        """Ensure aliases are lowercase."""
        self.aliases = [a.lower() for a in self.aliases]
        self.keywords = [k.lower() for k in self.keywords]


class MerchantDatabase:
    """
    Database of merchants with location type classification.

    Merchants provide CONTEXT for the classifier, not direct category assignment.
    The context engine combines merchant + intent + action to determine category.
    """

    def __init__(self):
        """Initialize the merchant database."""
        self._merchants: Dict[str, Merchant] = {}
        self._aliases: Dict[str, str] = {}  # alias -> merchant key
        self._keywords: Dict[str, str] = {}  # keyword -> merchant key
        self._location_index: Dict[LocationType, List[str]] = {}
        self._pattern: Optional[re.Pattern] = None

        self._build_database()
        self._build_indices()
        self._build_pattern()

    def _build_database(self) -> None:
        """Build the complete merchant database."""

        # ============================================================
        # SHOPPING MALLS
        # ============================================================
        mall_merchants = [
            Merchant(
                name="Royal City",
                aliases=["royal city", "royal city hn", "rc", "royal city hà nội"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống", "Giải trí", "Giao thông"],
                keywords=["mall", "trung tâm thương mại", "shops", "cửa hàng"],
            ),
            Merchant(
                name="Vincom",
                aliases=["vincom", "vincom center", "vincom mega mall", "vincom điện máy"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống", "Giải trí", "Giao thông"],
                keywords=["mall", "trung tâm thương mại", "shops", "cửa hàng", "siêu thị"],
            ),
            Merchant(
                name="AEON Mall",
                aliases=["aeon", "aeon mall", "aeonmall", "aeon mall hà nội", "aeon bình tân"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thực phẩm", "Thức ăn & Đồ uống", "Giải trí"],
                keywords=["mall", "trung tâm thương mại", "cửa hàng", "siêu thị"],
            ),
            Merchant(
                name="Lotte Mall",
                aliases=["lotte", "lotte mall", "lotte center", "lotte mart", "lotte supermarket"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thực phẩm", "Thức ăn & Đồ uống", "Giải trí"],
                keywords=["mall", "trung tâm thương mại", "cửa hàng", "siêu thị"],
            ),
            Merchant(
                name="Aeon Citimart",
                aliases=["aeon citimart", "citimart", "citi mart", "aeon e commerce"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                keywords=["siêu thị", "grocery", "market"],
            ),
            Merchant(
                name="Grandview",
                aliases=["grandview", "grand view", "tầm view", "tam view"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống", "Giải trí"],
                keywords=["mall", "trung tâm thương mại"],
            ),
            Merchant(
                name="Time City",
                aliases=["time city", "times city", "timecity", "timescity"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống", "Giải trí"],
                keywords=["mall", "trung tâm thương mại"],
            ),
            Merchant(
                name="The Manor",
                aliases=["the manor", "manor", "the manor oai pking"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống"],
                keywords=["mall", "trung tâm thương mại"],
            ),
            Merchant(
                name="Mipec",
                aliases=["mipec", "mipec tower", "mipec city"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống"],
                keywords=["mall", "trung tâm thương mại"],
            ),
            Merchant(
                name="Keangnam",
                aliases=["keangnam", "keangnam landmark", "landmark 72"],
                location_type=LocationType.MALL,
                possible_categories=["Mua sắm", "Thức ăn & Đồ uống", "Giải trí"],
                keywords=["mall", "trung tâm thương mại"],
            ),
        ]
        for m in mall_merchants:
            self._add_merchant(m)

        # ============================================================
        # CINEMAS
        # ============================================================
        cinema_merchants = [
            Merchant(
                name="CGV",
                aliases=["cgv", "cgv cinema", "cgv cinemas", "cgv cinemas viet nam"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="CGV",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
            Merchant(
                name="BHD Star",
                aliases=["bhd", "bhd star", "bhd cinema", "bhd cinemas"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="BHD",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
            Merchant(
                name="Galaxy Cinema",
                aliases=["galaxy", "galaxy cinema", "galaxy cinemas", "galaxy nguyễn trãi"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="Galaxy",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
            Merchant(
                name="Lotte Cinema",
                aliases=["lotte cinema", "lotte cinestar", "cinestar"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="Lotte",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
            Merchant(
                name="CineStar",
                aliases=["cinestar", "cine star", "cineStar"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="CineStar",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
            Merchant(
                name="Mega GS",
                aliases=["mega gs", "mega", "megags", "mega gs cinema"],
                location_type=LocationType.CINEMA,
                possible_categories=["Giải trí"],
                brand="Mega GS",
                keywords=["rạp chiếu phim", "phim", "cinema", "movie"],
            ),
        ]
        for m in cinema_merchants:
            self._add_merchant(m)

        # ============================================================
        # COFFEE CHAINS
        # ============================================================
        coffee_merchants = [
            Merchant(
                name="Highlands Coffee",
                aliases=["highlands", "highlands coffee", "highland", "highland coffee"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Highlands Coffee",
                keywords=["cafe", "cà phê", "coffee", "đồ uống"],
            ),
            Merchant(
                name="Starbucks",
                aliases=["starbucks", "starbucks vietnam", "starbucks vn"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Starbucks",
                keywords=["cafe", "cà phê", "coffee", "đồ uống"],
            ),
            Merchant(
                name="Phúc Long",
                aliases=["phuc long", "phúc long", "phuc long coffee", "phuc long tea"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Phúc Long",
                keywords=["cafe", "cà phê", "trà", "đồ uống"],
            ),
            Merchant(
                name="The Coffee House",
                aliases=["the coffee house", "coffee house", "thecoffeehouse", "tch"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="The Coffee House",
                keywords=["cafe", "cà phê", "đồ uống"],
            ),
            Merchant(
                name="Trung Nguyên",
                aliases=["trung nguyen", "trung nguyên", "trung nguyen legend", "tn"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Trung Nguyên",
                keywords=["cafe", "cà phê", "đồ uống"],
            ),
            Merchant(
                name="Passio",
                aliases=["passio", "passio coffee", "passion coffee"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Passio",
                keywords=["cafe", "cà phê", "đồ uống"],
            ),
            Merchant(
                name="Gong Cha",
                aliases=["gong cha", "gông cha", "gongcha", "gong cha tea"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Gong Cha",
                keywords=["trà sữa", "tra sua", "bubble tea", "đồ uống"],
            ),
            Merchant(
                name="Koi Thé",
                aliases=["koi", "koi the", "koi thé", "koi cafe"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Koi Thé",
                keywords=["trà sữa", "tra sua", "bubble tea", "đồ uống"],
            ),
            Merchant(
                name="Bobapop",
                aliases=["bobapop", "boba pop", "bobapop tea", "bobapop奶茶"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Bobapop",
                keywords=["trà sữa", "tra sua", "bubble tea", "đồ uống"],
            ),
        ]
        for m in coffee_merchants:
            self._add_merchant(m)

        # ============================================================
        # FAST FOOD / RESTAURANTS
        # ============================================================
        restaurant_merchants = [
            Merchant(
                name="KFC",
                aliases=["kfc", "kfc vietnam", "kfc vn"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="KFC",
                keywords=["gà rán", "fast food", "burger", "đồ ăn nhanh"],
            ),
            Merchant(
                name="Lotteria",
                aliases=["lotteria", "lotte ria", "lotteria vietnam"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Lotteria",
                keywords=["gà rán", "fast food", "burger", "đồ ăn nhanh"],
            ),
            Merchant(
                name="McDonald's",
                aliases=["mcdonald", "mcdonald's", "mcDonald", "mc donald", "mcd"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="McDonald's",
                keywords=["burger", "fast food", "đồ ăn nhanh"],
            ),
            Merchant(
                name="Pizza Hut",
                aliases=["pizza hut", "pizzahut", "pizza"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Pizza Hut",
                keywords=["pizza", "pasta", "đồ ăn"],
            ),
            Merchant(
                name="Domino's Pizza",
                aliases=["domino", "domino pizza", "dominos"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Domino's",
                keywords=["pizza", "đồ ăn"],
            ),
            Merchant(
                name="Jollibee",
                aliases=["jollibee", "jollibee vietnam", "jollibee vn"],
                location_type=LocationType.RESTAURANT,
                possible_categories=["Thức ăn & Đồ uống"],
                brand="Jollibee",
                keywords=["gà rán", "spaghetti", "fast food"],
            ),
            Merchant(
                name="Quán ăn",
                aliases=["quán ăn", "quán ăn", "quan an", "quán", "cơm", "bún", "phở"],
                location_type=LocationType.STREET,
                possible_categories=["Thức ăn & Đồ uống"],
                keywords=["quán ăn", "cơm", "bún", "phở", "mì", "hủ tiếu"],
            ),
        ]
        for m in restaurant_merchants:
            self._add_merchant(m)

        # ============================================================
        # SUPERMARKETS
        # ============================================================
        supermarket_merchants = [
            Merchant(
                name="WinMart",
                aliases=["winmart", "win mart", "winmart+", "win mart+", "walmart"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                brand="WinMart",
                keywords=["siêu thị", "grocery", "market", "thực phẩm"],
            ),
            Merchant(
                name="Co.opMart",
                aliases=["coopmart", "co.opmart", "co.op mart", "coop mart"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                brand="Co.opMart",
                keywords=["siêu thị", "grocery", "market", "thực phẩm"],
            ),
            Merchant(
                name="BigC",
                aliases=["bigc", "big c", "big c vietnam", "go!"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                brand="BigC",
                keywords=["siêu thị", "grocery", "market", "thực phẩm"],
            ),
            Merchant(
                name="Aeon",
                aliases=["aeon", "aeon supermarket", "aeon mart", "aeon citimart"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                brand="AEON",
                keywords=["siêu thị", "grocery", "market", "thực phẩm"],
            ),
            Merchant(
                name="Lotte Mart",
                aliases=["lotte mart", "lotte mart", "lotte supermarket"],
                location_type=LocationType.SUPERMARKET,
                possible_categories=["Thực phẩm", "Thức ăn & Đồ uống", "Mua sắm"],
                brand="Lotte",
                keywords=["siêu thị", "grocery", "market", "thực phẩm"],
            ),
        ]
        for m in supermarket_merchants:
            self._add_merchant(m)

        # ============================================================
        # CONVENIENCE STORES
        # ============================================================
        convenience_merchants = [
            Merchant(
                name="Circle K",
                aliases=["circle k", "circlek", "circle k vietnam", "circle k vn"],
                location_type=LocationType.CONVENIENCE,
                possible_categories=["Thức ăn & Đồ uống", "Thực phẩm"],
                brand="Circle K",
                keywords=["cửa hàng tiện lợi", "convenience store", "đồ uống", "snack"],
            ),
            Merchant(
                name="GS25",
                aliases=["gs25", "gs 25", "gs25 vietnam", "gs mart"],
                location_type=LocationType.CONVENIENCE,
                possible_categories=["Thức ăn & Đồ uống", "Thực phẩm"],
                brand="GS25",
                keywords=["cửa hàng tiện lợi", "convenience store", "đồ uống", "snack"],
            ),
            Merchant(
                name="FamilyMart",
                aliases=["familymart", "family mart", "family mart vietnam", "fm"],
                location_type=LocationType.CONVENIENCE,
                possible_categories=["Thức ăn & Đồ uống", "Thực phẩm"],
                brand="FamilyMart",
                keywords=["cửa hàng tiện lợi", "convenience store", "đồ uống", "snack"],
            ),
            Merchant(
                name="Shop 89",
                aliases=["shop 89", "shop89", "cửa hàng 89", "cuahang 89"],
                location_type=LocationType.CONVENIENCE,
                possible_categories=["Thức ăn & Đồ uống", "Thực phẩm"],
                keywords=["cửa hàng tiện lợi", "convenience store"],
            ),
        ]
        for m in convenience_merchants:
            self._add_merchant(m)

        # ============================================================
        # GAS STATIONS
        # ============================================================
        gas_merchants = [
            Merchant(
                name="Petrolimex",
                aliases=["petrolimex", "petrol", "petrolimex điện máy"],
                location_type=LocationType.GAS_STATION,
                possible_categories=["Giao thông"],
                brand="Petrolimex",
                keywords=["xăng", "dầu", "nhiên liệu", "gas station"],
            ),
            Merchant(
                name="Shell",
                aliases=["shell", "shell vietnam", "shell station"],
                location_type=LocationType.GAS_STATION,
                possible_categories=["Giao thông"],
                brand="Shell",
                keywords=["xăng", "dầu", "nhiên liệu", "gas station"],
            ),
            Merchant(
                name="PVOil",
                aliases=["pv oil", "pvoil", "pvoil điện máy"],
                location_type=LocationType.GAS_STATION,
                possible_categories=["Giao thông"],
                brand="PVOil",
                keywords=["xăng", "dầu", "nhiên liệu", "gas station"],
            ),
            Merchant(
                name="Caltex",
                aliases=["caltex", "caltex vietnam", "caltex station"],
                location_type=LocationType.GAS_STATION,
                possible_categories=["Giao thông"],
                brand="Caltex",
                keywords=["xăng", "dầu", "nhiên liệu", "gas station"],
            ),
        ]
        for m in gas_merchants:
            self._add_merchant(m)

        # ============================================================
        # E-COMMERCE
        # ============================================================
        ecommerce_merchants = [
            Merchant(
                name="Shopee",
                aliases=["shopee", "shopeefood", "shopee food", "shopee mart"],
                location_type=LocationType.STREET,
                possible_categories=["Mua sắm", "Thực phẩm", "Thức ăn & Đồ uống"],
                brand="Shopee",
                keywords=["mua sắm", "online shopping", "e-commerce"],
            ),
            Merchant(
                name="Lazada",
                aliases=["lazada", "lazada vn", "lazada vietnam"],
                location_type=LocationType.STREET,
                possible_categories=["Mua sắm"],
                brand="Lazada",
                keywords=["mua sắm", "online shopping", "e-commerce"],
            ),
            Merchant(
                name="Tiki",
                aliases=["tiki", "tiki vn", "tiki vietnam"],
                location_type=LocationType.STREET,
                possible_categories=["Mua sắm"],
                brand="Tiki",
                keywords=["mua sắm", "online shopping", "e-commerce"],
            ),
        ]
        for m in ecommerce_merchants:
            self._add_merchant(m)

        # ============================================================
        # TRANSPORT
        # ============================================================
        transport_merchants = [
            Merchant(
                name="Grab",
                aliases=["grab", "grabcar", "grab bike", "grab xe may", "grabtaxi"],
                location_type=LocationType.STREET,
                possible_categories=["Giao thông", "Thức ăn & Đồ uống"],
                brand="Grab",
                keywords=["taxi", "xe máy", "grab", "vận chuyển"],
            ),
            Merchant(
                name="Be",
                aliases=["be", "be app", "be vietnam", "be xe"],
                location_type=LocationType.STREET,
                possible_categories=["Giao thông"],
                brand="Be",
                keywords=["taxi", "xe máy", "vận chuyển"],
            ),
            Merchant(
                name="Gojek",
                aliases=["gojek", "gojek vietnam", "go ride", "go car"],
                location_type=LocationType.STREET,
                possible_categories=["Giao thông"],
                brand="Gojek",
                keywords=["taxi", "xe máy", "vận chuyển"],
            ),
        ]
        for m in transport_merchants:
            self._add_merchant(m)

    def _add_merchant(self, merchant: Merchant) -> None:
        """Add a merchant to the database."""
        key = merchant.name.lower().replace(' ', '_')
        self._merchants[key] = merchant

        # Build alias index
        for alias in merchant.aliases:
            self._aliases[alias] = key

        # Build keyword index
        for keyword in merchant.keywords:
            self._keywords[keyword] = key

        # Also index by name
        for name_part in merchant.name.lower().split():
            if len(name_part) > 2:
                self._keywords[name_part] = key

    def _build_indices(self) -> None:
        """Build location type index."""
        for loc_type in LocationType:
            self._location_index[loc_type] = []

        for key, merchant in self._merchants.items():
            self._location_index[merchant.location_type].append(key)

    def _build_pattern(self) -> None:
        """Build regex pattern for efficient matching."""
        # Combine all search terms
        all_terms = set()
        all_terms.update(self._aliases.keys())
        all_terms.update(self._keywords.keys())

        # Sort by length descending
        sorted_terms = sorted(all_terms, key=len, reverse=True)

        # Build pattern with word boundaries
        pattern = r'\b(' + '|'.join(re.escape(t) for t in sorted_terms) + r')\b'
        self._pattern = re.compile(pattern, re.IGNORECASE)

    def lookup(self, text: str) -> List[Tuple[Merchant, int]]:
        """
        Lookup merchants in text.

        Args:
            text: Input text to search

        Returns:
            List of (Merchant, match_position) tuples, sorted by position
        """
        matches = []
        text_lower = text.lower()

        # Try all search methods
        for alias, key in self._aliases.items():
            if alias in text_lower:
                pos = text_lower.find(alias)
                matches.append((self._merchants[key], pos))

        for keyword, key in self._keywords.items():
            if keyword in text_lower:
                pos = text_lower.find(keyword)
                matches.append((self._merchants[key], pos))

        # Sort by position
        matches.sort(key=lambda x: x[1])

        # Remove duplicates while preserving order
        seen = set()
        unique_matches = []
        for merchant, pos in matches:
            if merchant.name not in seen:
                seen.add(merchant.name)
                unique_matches.append((merchant, pos))

        return unique_matches

    def detect(self, text: str) -> Optional[Merchant]:
        """
        Detect the primary merchant in text.

        Args:
            text: Input text

        Returns:
            The detected Merchant or None
        """
        matches = self.lookup(text)
        if matches:
            return matches[0][0]
        return None

    def get_by_location_type(self, location_type: LocationType) -> List[Merchant]:
        """Get all merchants of a specific location type."""
        keys = self._location_index.get(location_type, [])
        return [self._merchants[k] for k in keys]

    def get_all_merchants(self) -> List[Merchant]:
        """Get all merchants in the database."""
        return list(self._merchants.values())


# Global merchant database instance
merchant_db = MerchantDatabase()


def detect_merchant(text: str) -> Optional[Merchant]:
    """Quick access to merchant detection."""
    return merchant_db.detect(text)


def lookup_merchants(text: str) -> List[Tuple[Merchant, int]]:
    """Quick access to merchant lookup."""
    return merchant_db.lookup(text)
