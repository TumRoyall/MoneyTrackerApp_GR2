"""
Context Rule Engine Module
=========================
Combines intent + merchant + action keywords to determine category.

This is the core of the new classifier. Rules are evaluated in order
of priority and combined with weighted scoring.

Rule format:
    ContextRule(intent, location_type, keywords, category, score)

Examples:
    - BUY + MALL → Shopping
    - FOOD + MALL → Food
    - WATCH + CINEMA → Entertainment
    - PARK + MALL → Transport
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from enum import Enum

from .intents import Intent
from .merchants import LocationType
from .config import CATEGORY_TYPE, TransactionType


class RulePriority(int, Enum):
    """Rule evaluation priority (higher = evaluated first)."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class ContextRule:
    """
    Context rule for category determination.

    A context rule combines:
    - Intent: What the user wants to do
    - LocationType: Where the action takes place
    - Keywords: Additional keywords that trigger this rule
    - Category: The resulting category
    - Priority: Rule evaluation priority
    - Score: Base score contribution

    Rules are evaluated in priority order, then by score.
    """
    intent: Optional[Intent]
    location_type: Optional[LocationType]
    keywords: List[str]
    category: str
    priority: RulePriority
    score: float
    transaction_type: TransactionType = TransactionType.EXPENSE
    description: str = ""

    def matches(self, text: str, detected_intent: Optional[Intent],
                detected_location: Optional[LocationType]) -> Tuple[bool, float]:
        """
        Check if this rule matches the given context.

        Args:
            text: Input text (normalized)
            detected_intent: Intent detected from text
            detected_location: Location type detected from text

        Returns:
            Tuple of (matches, match_score)
        """
        match_score = 0.0
        intent_match = False
        location_match = False
        keyword_match = False

        # Check intent match
        if self.intent is None:
            intent_match = True  # Wildcard - any intent
        elif detected_intent == self.intent:
            intent_match = True
            match_score += 30.0  # Intent contribution

        # Check location match
        if self.location_type is None:
            location_match = True  # Wildcard - any location
        elif detected_location == self.location_type:
            location_match = True
            match_score += 25.0  # Location contribution

        # Check keyword match
        text_lower = text.lower()
        matched_keywords = []
        for kw in self.keywords:
            if kw.lower() in text_lower:
                matched_keywords.append(kw)
                match_score += 10.0 * len(kw) / 5.0  # Longer keywords = more points

        if self.keywords and matched_keywords:
            keyword_match = True
        elif not self.keywords:
            keyword_match = True  # No keywords required

        # Rule matches if all required components match
        matches = intent_match and location_match and keyword_match

        if matches:
            match_score += self.score + self.priority.value * 5.0

        return (matches, match_score)


class ContextRuleEngine:
    """
    Context rule engine that evaluates rules against transaction text.

    Rules are evaluated in priority order:
    1. High priority rules with specific context
    2. Medium priority rules
    3. Low priority rules as fallback

    The engine combines:
    - Intent detection
    - Merchant/Location detection
    - Keyword matching
    - Rule scoring
    """

    def __init__(self):
        """Initialize the context rule engine."""
        self._rules: List[ContextRule] = []
        self._keyword_index: Dict[str, List[ContextRule]] = {}
        self._build_rules()

    def _build_rules(self) -> None:
        """Build the complete rule set."""

        # ============================================================
        # HIGH PRIORITY RULES (specific context)
        # ============================================================

        # --- FOOD DELIVERY rules (CRITICAL - must override transport) ---
        self.add_rule(ContextRule(
            intent=None,
            location_type=None,
            keywords=["grabfood", "grab food", "now", "baemin", "shopeefood", "shopee food", "food delivery", "giao đồ ăn"],
            category="Thức ăn & Đồ uống",
            priority=RulePriority.CRITICAL,
            score=60.0,
            description="Food delivery - overrides transport",
        ))

        # --- AMBIGUOUS MALL rules (default to shopping when unclear) ---
        self.add_rule(ContextRule(
            intent=None,
            location_type=LocationType.MALL,
            keywords=["royal city", "vincom", "aeon", "lotte", "lotte mart", "aeon mall", "grandview", "time city", "mipec", "keangnam"],
            category="Mua sắm",
            priority=RulePriority.HIGH,
            score=40.0,
            description="Going to mall defaults to shopping",
        ))

        # --- FOOD & BEVERAGE rules ---
        self.add_rule(ContextRule(
            intent=Intent.FOOD,
            location_type=LocationType.MALL,
            keywords=["ăn", "uống", "quán", "nhà hàng", "food", "restaurant"],
            category="Thức ăn & Đồ uống",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Eating at mall",
        ))

        self.add_rule(ContextRule(
            intent=Intent.FOOD,
            location_type=LocationType.RESTAURANT,
            keywords=["cafe", "cà phê", "coffee", "trà", "tea", "nước", "đồ uống"],
            category="Thức ăn & Đồ uống",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Drinks at cafe/restaurant",
        ))

        self.add_rule(ContextRule(
            intent=Intent.FOOD,
            location_type=LocationType.CINEMA,
            keywords=["bắp", "nước", "popcorn", "coca", "pepsi", "đồ uống", "thức ăn"],
            category="Thức ăn & Đồ uống",
            priority=RulePriority.HIGH,
            score=40.0,
            description="Food at cinema",
        ))

        # --- SHOPPING rules ---
        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=LocationType.MALL,
            keywords=["mua", "đồ", "shopping", "shop", "áo", "quần", "giày", "túi"],
            category="Mua sắm",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Shopping at mall",
        ))

        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=None,
            keywords=["shopee", "lazada", "tiki", "amazon", "mua online", "shopping online"],
            category="Mua sắm",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Online shopping",
        ))

        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=None,
            keywords=["áo", "quần", "váy", "đầm", "giày", "túi", "balo", "nón", "thời trang"],
            category="Mua sắm",
            priority=RulePriority.HIGH,
            score=45.0,
            description="Clothing shopping",
        ))

        # --- ENTERTAINMENT rules ---
        self.add_rule(ContextRule(
            intent=Intent.ENTERTAINMENT,
            location_type=LocationType.CINEMA,
            keywords=["xem phim", "vé", "movie", "phim", "cinema", "rạp"],
            category="Giải trí",
            priority=RulePriority.HIGH,
            score=55.0,
            description="Watching movie at cinema",
        ))

        self.add_rule(ContextRule(
            intent=Intent.ENTERTAINMENT,
            location_type=LocationType.MALL,
            keywords=["xem phim", "rạp", "game", "trò chơi", "bowling", "bi-a"],
            category="Giải trí",
            priority=RulePriority.HIGH,
            score=45.0,
            description="Entertainment at mall",
        ))

        self.add_rule(ContextRule(
            intent=Intent.ENTERTAINMENT,
            location_type=None,
            keywords=["netflix", "spotify", "youtube premium", "disney", "hbo"],
            category="Giải trí",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Streaming subscriptions",
        ))

        self.add_rule(ContextRule(
            intent=Intent.ENTERTAINMENT,
            location_type=None,
            keywords=["karaoke", "hát", "ca hat", "sing", "phòng hát"],
            category="Giải trí",
            priority=RulePriority.HIGH,
            score=45.0,
            description="Karaoke",
        ))

        # --- TRANSPORT rules ---
        self.add_rule(ContextRule(
            intent=Intent.PARK,
            location_type=LocationType.MALL,
            keywords=["gửi xe", "đỗ xe", "parking", "xe máy", "ô tô", "car"],
            category="Giao thông",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Parking at mall",
        ))

        self.add_rule(ContextRule(
            intent=Intent.TRANSPORT,
            location_type=None,
            keywords=["grab", "taxi", "uber", "be", "gojek", "mai linh"],
            category="Giao thông",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Ride-hailing",
        ))

        self.add_rule(ContextRule(
            intent=Intent.TRANSPORT,
            location_type=LocationType.GAS_STATION,
            keywords=["xăng", "dầu", "fuel", "petrol", "gas"],
            category="Giao thông",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Gas/fuel",
        ))

        # --- HEALTH rules ---
        self.add_rule(ContextRule(
            intent=Intent.HEALTH,
            location_type=None,
            keywords=["bệnh viện", "bv", "phòng khám", "khám bệnh", "bác sĩ"],
            category="Sức khỏe",
            priority=RulePriority.HIGH,
            score=55.0,
            description="Hospital/medical",
        ))

        self.add_rule(ContextRule(
            intent=Intent.HEALTH,
            location_type=None,
            keywords=["thuốc", "dược", "nhà thuốc", "pharmacy", "vitamin"],
            category="Sức khỏe",
            priority=RulePriority.MEDIUM,
            score=40.0,
            description="Pharmacy/medicine",
        ))

        # --- BEAUTY rules ---
        self.add_rule(ContextRule(
            intent=Intent.BEAUTY,
            location_type=None,
            keywords=["spa", "massage", "mát xa", "làm tóc", "cắt tóc", "nhuộm", "nail", "làm móng"],
            category="Làm đẹp",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Beauty services",
        ))

        # --- SPORTS rules ---
        self.add_rule(ContextRule(
            intent=Intent.SPORTS,
            location_type=None,
            keywords=["gym", "fitness", "tập gym", "vô gym", "phòng gym", "workout"],
            category="Thể thao",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Gym/fitness",
        ))

        # ============================================================
        # MEDIUM PRIORITY RULES (general context)
        # ============================================================

        # --- GROCERY rules ---
        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=LocationType.SUPERMARKET,
            keywords=["thịt", "cá", "rau", "trái cây", "sữa", "trứng", "grocery", "food"],
            category="Thực phẩm",
            priority=RulePriority.MEDIUM,
            score=40.0,
            description="Grocery shopping",
        ))

        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=LocationType.CONVENIENCE,
            keywords=["thịt", "cá", "rau", "trái cây", "sữa", "snack", "đồ uống"],
            category="Thực phẩm",
            priority=RulePriority.MEDIUM,
            score=35.0,
            description="Convenience store",
        ))

        self.add_rule(ContextRule(
            intent=Intent.BUY,
            location_type=None,
            keywords=["siêu thị", "supermarket", "mart", "chợ", "market"],
            category="Thực phẩm",
            priority=RulePriority.MEDIUM,
            score=35.0,
            description="Supermarket",
        ))

        # --- HOME rules ---
        self.add_rule(ContextRule(
            intent=Intent.PAY,
            location_type=None,
            keywords=["tiền nhà", "thuê nhà", "rent", "nhà trọ", "phòng trọ"],
            category="Nhà",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Rent",
        ))

        self.add_rule(ContextRule(
            intent=Intent.PAY,
            location_type=None,
            keywords=["tiền điện", "tiền nước", "tiền internet", "wifi", "gas", "cước"],
            category="Nhà",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Utilities",
        ))

        # --- TRAVEL rules ---
        self.add_rule(ContextRule(
            intent=Intent.TRAVEL,
            location_type=None,
            keywords=["máy bay", "vé máy bay", "flight", "airplane", "hàng không"],
            category="Du lịch",
            priority=RulePriority.HIGH,
            score=55.0,
            description="Flight",
        ))

        self.add_rule(ContextRule(
            intent=Intent.TRAVEL,
            location_type=None,
            keywords=["khách sạn", "hotel", "resort", "homestay", "airbnb", "booking"],
            category="Du lịch",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Accommodation",
        ))

        # --- EDUCATION rules ---
        self.add_rule(ContextRule(
            intent=Intent.EDUCATION,
            location_type=None,
            keywords=["học phí", "trường", "khóa học", "course", "sách", "book"],
            category="Giáo dục",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Education",
        ))

        # --- PET rules ---
        self.add_rule(ContextRule(
            intent=Intent.PET,
            location_type=None,
            keywords=["thú cưng", "pet", "chó", "mèo", "thức ăn cho pet", "thuốc cho pet"],
            category="Thú cưng",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Pet care",
        ))

        # --- INVESTMENT/SAVINGS rules ---
        self.add_rule(ContextRule(
            intent=Intent.INVEST,
            location_type=None,
            keywords=["gửi tiết kiệm", "tiết kiệm", "savings", "deposit"],
            category="Tiết kiệm",
            priority=RulePriority.HIGH,
            score=50.0,
            description="Savings",
        ))

        self.add_rule(ContextRule(
            intent=Intent.INVEST,
            location_type=None,
            keywords=["đầu tư", "chứng khoán", "cổ phiếu", "vàng", "crypto", "bất động sản"],
            category="Tiết kiệm",  # Can be Investment too
            priority=RulePriority.MEDIUM,
            score=40.0,
            description="Investment",
        ))

        # ============================================================
        # LOW PRIORITY RULES (fallback)
        # ============================================================

        # Generic food
        self.add_rule(ContextRule(
            intent=Intent.FOOD,
            location_type=None,
            keywords=["ăn", "uống", "cơm", "phở", "bún", "mì", "hủ tiếu", "bánh", "cafe"],
            category="Thức ăn & Đồ uống",
            priority=RulePriority.LOW,
            score=30.0,
            description="Generic food",
        ))

        # Generic transport
        self.add_rule(ContextRule(
            intent=Intent.TRANSPORT,
            location_type=None,
            keywords=["xăng", "dầu", "xe máy", "ô tô", "sửa xe", "bảo dưỡng"],
            category="Giao thông",
            priority=RulePriority.LOW,
            score=30.0,
            description="Generic transport",
        ))

        # ============================================================
        # INCOME RULES
        # ============================================================

        # Salary
        self.add_rule(ContextRule(
            intent=Intent.INCOME,
            location_type=None,
            keywords=["lương", "lĩnh lương", "salary", "wage", "thu nhập"],
            category="Lương",
            priority=RulePriority.CRITICAL,
            score=60.0,
            transaction_type=TransactionType.INCOME,
            description="Salary",
        ))

        # Bonus
        self.add_rule(ContextRule(
            intent=Intent.INCOME,
            location_type=None,
            keywords=["thưởng", "bonus", "thưởng tháng", "thưởng quý", "thưởng năm"],
            category="Tiền thưởng",
            priority=RulePriority.CRITICAL,
            score=60.0,
            transaction_type=TransactionType.INCOME,
            description="Bonus",
        ))

        # Investment returns
        self.add_rule(ContextRule(
            intent=Intent.INCOME,
            location_type=None,
            keywords=["cổ tức", "lãi", "dividend", "interest", "profit", "lợi nhuận"],
            category="Đầu tư",
            priority=RulePriority.HIGH,
            score=50.0,
            transaction_type=TransactionType.INCOME,
            description="Investment returns",
        ))

        # Business income
        self.add_rule(ContextRule(
            intent=Intent.INCOME,
            location_type=None,
            keywords=["bán hàng", "doanh thu", "kinh doanh", "buôn bán", "business"],
            category="Kinh doanh",
            priority=RulePriority.HIGH,
            score=50.0,
            transaction_type=TransactionType.INCOME,
            description="Business income",
        ))

    def add_rule(self, rule: ContextRule) -> None:
        """Add a rule to the engine."""
        self._rules.append(rule)

        # Build keyword index for faster matching
        for kw in rule.keywords:
            if kw.lower() not in self._keyword_index:
                self._keyword_index[kw.lower()] = []
            self._keyword_index[kw.lower()].append(rule)

    def evaluate(self, text: str, detected_intent: Optional[Intent],
                 detected_location: Optional[LocationType]) -> List[Tuple[ContextRule, float]]:
        """
        Evaluate all rules against the given context.

        Args:
            text: Input text (normalized)
            detected_intent: Intent detected from text
            detected_location: Location type detected from text

        Returns:
            List of (rule, score) tuples that match, sorted by score
        """
        matches = []

        for rule in self._rules:
            matches_rule, score = rule.matches(text, detected_intent, detected_location)
            if matches_rule:
                matches.append((rule, score))

        # Sort by score descending
        matches.sort(key=lambda x: x[1], reverse=True)

        return matches

    def get_best_match(self, text: str, detected_intent: Optional[Intent],
                       detected_location: Optional[LocationType]) -> Optional[Tuple[ContextRule, float]]:
        """
        Get the best matching rule.

        Args:
            text: Input text
            detected_intent: Detected intent
            detected_location: Detected location

        Returns:
            Tuple of (best_rule, score) or None
        """
        matches = self.evaluate(text, detected_intent, detected_location)
        if matches:
            return matches[0]
        return None

    def get_category(self, text: str, detected_intent: Optional[Intent],
                     detected_location: Optional[LocationType]) -> Tuple[str, TransactionType, float]:
        """
        Get the best matching category.

        Args:
            text: Input text
            detected_intent: Detected intent
            detected_location: Detected location

        Returns:
            Tuple of (category, transaction_type, confidence_score)
        """
        best = self.get_best_match(text, detected_intent, detected_location)
        if best:
            rule, score = best
            return (rule.category, rule.transaction_type, score)
        return ("Chưa phân loại", TransactionType.EXPENSE, 0.0)


# Global context rule engine instance
context_engine = ContextRuleEngine()


def evaluate_context(text: str, detected_intent: Optional[Intent],
                     detected_location: Optional[LocationType]) -> List[Tuple[ContextRule, float]]:
    """Quick access to context evaluation."""
    return context_engine.evaluate(text, detected_intent, detected_location)


def get_context_category(text: str, detected_intent: Optional[Intent],
                         detected_location: Optional[LocationType]) -> Tuple[str, TransactionType, float]:
    """Quick access to get category from context."""
    return context_engine.get_category(text, detected_intent, detected_location)
