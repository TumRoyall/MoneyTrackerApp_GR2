"""
Negative Rules Module
=================
Negative rules to prevent false positives and misclassifications.

Negative rules work by:
1. Disqualifying categories when certain keywords appear
2. Applying heavy penalties to scores
3. Preventing certain intent-category combinations
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple, Callable
from enum import Enum

from .config import CATEGORY_TYPE, TransactionType


class NegativeRuleType(str, Enum):
    """Type of negative rule."""
    HARD_EXCLUDE = "hard_exclude"  # Completely excludes the category
    SOFT_PENALTY = "soft_penalty"  # Applies penalty but doesn't exclude
    CONTEXT_OVERRIDE = "context_override"  # Overrides based on context


@dataclass
class NegativeRule:
    """
    A negative rule that prevents or penalizes category assignment.

    Attributes:
        keywords: Keywords that trigger this rule
        excluded_categories: Categories to exclude
        rule_type: Type of rule (HARD_EXCLUDE, SOFT_PENALTY, CONTEXT_OVERRIDE)
        penalty: Score penalty to apply (for SOFT_PENALTY)
        override_category: Category to use instead (for CONTEXT_OVERRIDE)
        description: Human-readable description
    """
    keywords: List[str]
    excluded_categories: List[str]
    rule_type: NegativeRuleType = NegativeRuleType.HARD_EXCLUDE
    penalty: float = 100.0
    override_category: Optional[str] = None
    description: str = ""


class NegativeRuleEngine:
    """
    Engine for applying negative rules.

    Negative rules prevent common misclassification patterns:
    - "điện thoại" should not trigger HOME (because of "điện")
    - GrabFood should not trigger TRANSPORT
    - Investment-related terms should not trigger SAVINGS for expenses
    """

    def __init__(self):
        """Initialize the negative rule engine."""
        self._rules: List[NegativeRule] = []
        self._build_rules()

    def _build_rules(self) -> None:
        """Build the complete negative rule set."""

        # ============================================================
        # HARD EXCLUSIONS - Completely disqualify categories
        # ============================================================

        # "điện" should not trigger HOME
        self.add_rule(NegativeRule(
            keywords=["điện thoại", "smartphone", "iphone", "samsung", "điện thoại di động"],
            excluded_categories=["Nhà"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Phone-related should not trigger HOME",
        ))

        # "điện" alone (in điện tử) should not trigger HOME
        self.add_rule(NegativeRule(
            keywords=["điện tử", "đồ điện", "thiết bị điện", "máy điện"],
            excluded_categories=["Nhà"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Electronics should not trigger HOME",
        ))

        # GrabFood/Now should not trigger TRANSPORT
        self.add_rule(NegativeRule(
            keywords=["grabfood", "grab food", "now", "baemin", "shopeefood", "shopee food"],
            excluded_categories=["Giao thông"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Food delivery should not trigger TRANSPORT",
        ))

        # "bắt" should not trigger TRANSPORT when used with other contexts
        self.add_rule(NegativeRule(
            keywords=["bắt đầu", "bắt đầu làm", "bắt tay", "bắt cá"],
            excluded_categories=["Giao thông"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Non-transport usage of 'bắt'",
        ))

        # "gửi" alone should not trigger SAVINGS
        self.add_rule(NegativeRule(
            keywords=["gửi xe", "gửi đồ", "gửi mail", "gửi tin nhắn", "gửi message"],
            excluded_categories=["Tiết kiệm"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Non-savings usage of 'gửi'",
        ))

        # "đầu tư" expense should not trigger INVESTMENT income category
        self.add_rule(NegativeRule(
            keywords=["đầu tư", "đầu tư chứng khoán", "đầu tư bất động sản", "đầu tư vàng"],
            excluded_categories=["Đầu tư"],  # When it's an expense, not income
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Investment expense should not trigger investment income",
        ))

        # "học" should not trigger ENTERTAINMENT
        self.add_rule(NegativeRule(
            keywords=["học", "học phí", "trường học", "học online", "khóa học"],
            excluded_categories=["Giải trí"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Education should not trigger entertainment",
        ))

        # "sức khỏe" in medical context should not trigger SPORTS
        self.add_rule(NegativeRule(
            keywords=["bệnh viện", "thuốc", "khám bệnh", "bác sĩ", "phòng khám"],
            excluded_categories=["Thể thao"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Medical/health should not trigger sports",
        ))

        # ============================================================
        # SOFT PENALTIES - Apply penalty but don't exclude
        # ============================================================

        # Generic "mua" should be penalized for certain categories
        self.add_rule(NegativeRule(
            keywords=["mua điện thoại", "mua laptop", "mua máy tính", "mua tablet"],
            excluded_categories=["Thực phẩm"],
            rule_type=NegativeRuleType.SOFT_PENALTY,
            penalty=50.0,
            description="Electronics purchase should not trigger grocery",
        ))

        self.add_rule(NegativeRule(
            keywords=["mua son", "mua kem", "mua mỹ phẩm", "mua nước hoa"],
            excluded_categories=["Thực phẩm"],
            rule_type=NegativeRuleType.SOFT_PENALTY,
            penalty=50.0,
            description="Beauty purchase should not trigger grocery",
        ))

        self.add_rule(NegativeRule(
            keywords=["mua thịt", "mua cá", "mua rau", "mua trái cây"],
            excluded_categories=["Mua sắm"],
            rule_type=NegativeRuleType.SOFT_PENALTY,
            penalty=30.0,
            description="Grocery items should not trigger general shopping",
        ))

        # Generic "ăn" should be penalized for non-food categories
        self.add_rule(NegativeRule(
            keywords=["ăn phở", "ăn bún", "ăn cơm", "ăn bánh", "ăn pizza"],
            excluded_categories=["Mua sắm", "Du lịch"],
            rule_type=NegativeRuleType.SOFT_PENALTY,
            penalty=40.0,
            description="Food should not trigger shopping or travel",
        ))

        # ============================================================
        # CONTEXT OVERRIDES - Override based on context
        # ============================================================

        # "xăng" at convenience store context should still be TRANSPORT
        # This is handled by context rules, not negative rules

        # "mua đồ" without specific context defaults to SHOPPING
        # This is handled by context rules

        # ============================================================
        # AMBIGUOUS PATTERNS - Handle ambiguous inputs
        # ============================================================

        # "đi vincom" - ambiguous, needs more context
        # This is handled by scoring engine with low confidence

        # "ăn vincom" - likely FOOD
        # This is handled by context rules

        # "mua điện thoại" - ELECTRONICS
        self.add_rule(NegativeRule(
            keywords=["mua điện thoại", "mua smartphone", "mua iphone", "mua samsung"],
            excluded_categories=["Nhà", "Thực phẩm"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Phone purchase is electronics",
        ))

        # "mua laptop" / "mua máy tính" - ELECTRONICS
        self.add_rule(NegativeRule(
            keywords=["mua laptop", "mua máy tính", "mua macbook", "mua imac"],
            excluded_categories=["Nhà", "Thực phẩm"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Computer purchase is electronics",
        ))

        # "mua thuốc" / "mua thuốc men" - HEALTH
        self.add_rule(NegativeRule(
            keywords=["mua thuốc", "mua thuốc men", "mua vitamin", "mua thực phẩm chức năng"],
            excluded_categories=["Thực phẩm"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Medicine purchase is health",
        ))

        # "thuê xe máy" - TRANSPORT
        self.add_rule(NegativeRule(
            keywords=["thuê xe máy", "thuê xe", "thuê ô tô", "thuê xe đạp"],
            excluded_categories=["Nhà"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Vehicle rental is transport",
        ))

        # "sửa xe" - TRANSPORT
        self.add_rule(NegativeRule(
            keywords=["sửa xe", "sửa xe máy", "sửa ô tô", "thay nhớt", "thay dầu"],
            excluded_categories=["Nhà"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Vehicle repair is transport",
        ))

        # "đổ xăng" - TRANSPORT
        self.add_rule(NegativeRule(
            keywords=["đổ xăng", "đổ dầu", "nạp xăng", "bơm xăng"],
            excluded_categories=["Nhà"],
            rule_type=NegativeRuleType.HARD_EXCLUDE,
            description="Fuel is transport",
        ))

    def add_rule(self, rule: NegativeRule) -> None:
        """Add a negative rule."""
        self._rules.append(rule)

    def check(self, text: str, candidate_categories: List[str]) -> Tuple[List[str], Dict[str, float]]:
        """
        Check negative rules against candidate categories.

        Args:
            text: Input text
            candidate_categories: List of potential categories

        Returns:
            Tuple of:
            - Filtered categories (after exclusions)
            - Dict of category -> penalty (for soft penalties)
        """
        text_lower = text.lower()
        filtered_categories = candidate_categories.copy()
        penalties: Dict[str, float] = {}

        for rule in self._rules:
            # Check if any keyword matches
            matches = any(kw.lower() in text_lower for kw in rule.keywords)

            if matches:
                for category in rule.excluded_categories:
                    if category in filtered_categories:
                        if rule.rule_type == NegativeRuleType.HARD_EXCLUDE:
                            filtered_categories.remove(category)
                        elif rule.rule_type == NegativeRuleType.SOFT_PENALTY:
                            penalties[category] = rule.penalty

        return (filtered_categories, penalties)

    def get_overrides(self, text: str) -> Dict[str, str]:
        """
        Get category overrides based on context.

        Args:
            text: Input text

        Returns:
            Dict of category -> override_category
        """
        text_lower = text.lower()
        overrides: Dict[str, str] = {}

        for rule in self._rules:
            if rule.rule_type == NegativeRuleType.CONTEXT_OVERRIDE:
                if any(kw.lower() in text_lower for kw in rule.keywords):
                    for category in rule.excluded_categories:
                        if rule.override_category:
                            overrides[category] = rule.override_category

        return overrides

    def should_exclude(self, text: str, category: str) -> bool:
        """
        Check if a category should be excluded.

        Args:
            text: Input text
            category: Category to check

        Returns:
            True if category should be excluded
        """
        text_lower = text.lower()

        for rule in self._rules:
            if rule.rule_type == NegativeRuleType.HARD_EXCLUDE:
                if category in rule.excluded_categories:
                    if any(kw.lower() in text_lower for kw in rule.keywords):
                        return True

        return False

    def get_penalty(self, text: str, category: str) -> float:
        """
        Get penalty for a category.

        Args:
            text: Input text
            category: Category to check

        Returns:
            Penalty value (0 if no penalty)
        """
        text_lower = text.lower()
        max_penalty = 0.0

        for rule in self._rules:
            if rule.rule_type == NegativeRuleType.SOFT_PENALTY:
                if category in rule.excluded_categories:
                    if any(kw.lower() in text_lower for kw in rule.keywords):
                        max_penalty = max(max_penalty, rule.penalty)

        return max_penalty


# Global negative rule engine instance
negative_engine = NegativeRuleEngine()


def apply_negative_rules(text: str, categories: List[str]) -> Tuple[List[str], Dict[str, float]]:
    """Quick access to negative rule application."""
    return negative_engine.check(text, categories)


def is_excluded(text: str, category: str) -> bool:
    """Quick access to exclusion check."""
    return negative_engine.should_exclude(text, category)


def get_penalty(text: str, category: str) -> float:
    """Quick access to penalty check."""
    return negative_engine.get_penalty(text, category)
