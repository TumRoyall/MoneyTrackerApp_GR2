"""
Configuration Module
====================
Central configuration for all categories, types, and constants.
"""

from enum import Enum
from typing import Dict, List


class TransactionType(str, Enum):
    """Transaction type enumeration."""
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"


# ============================================================
# CATEGORIES - Must match MoneyTracker app exactly
# ============================================================

# 16 EXPENSE categories (indices 0-15)
EXPENSE_CATEGORIES: List[str] = [
    "Chưa phân loại",      # 0 - uncategorized
    "Thức ăn & Đồ uống",   # 1 - food
    "Mua sắm",             # 2 - shopping
    "Du lịch",             # 3 - travel
    "Sức khỏe",            # 4 - health
    "Giải trí",            # 5 - entertainment
    "Thú cưng",            # 6 - pet
    "Thực phẩm",           # 7 - grocery
    "Điện tử",             # 8 - electronics
    "Làm đẹp",             # 9 - beauty
    "Thể thao",            # 10 - sports
    "Giáo dục",            # 11 - education
    "Giao thông",          # 12 - transport
    "Nhà",                 # 13 - home
    "Nợ",                  # 14 - debt
    "Tiết kiệm",           # 15 - savings
]

# 5 INCOME categories (indices 16-20)
INCOME_CATEGORIES: List[str] = [
    "Chưa được phân loại", # 16 - uncategorized_income
    "Lương",               # 17 - salary
    "Đầu tư",              # 18 - investment
    "Tiền thưởng",         # 19 - bonus
    "Kinh doanh",          # 20 - business
]

# All categories combined
CATEGORIES: List[str] = EXPENSE_CATEGORIES + INCOME_CATEGORIES

# Map category name -> category ID for backend
CATEGORY_ID_MAP: Dict[str, str] = {
    # EXPENSE
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
    # INCOME
    "Chưa được phân loại": "uncategorized_income",
    "Lương": "salary",
    "Đầu tư": "investment",
    "Tiền thưởng": "bonus",
    "Kinh doanh": "business",
}

# Category -> Type mapping
CATEGORY_TYPE: Dict[str, TransactionType] = {
    **{cat: TransactionType.EXPENSE for cat in EXPENSE_CATEGORIES},
    **{cat: TransactionType.INCOME for cat in INCOME_CATEGORIES},
}

# Reverse lookup: ID -> Category name
CATEGORY_ID_TO_NAME: Dict[str, str] = {v: k for k, v in CATEGORY_ID_MAP.items()}


# ============================================================
# SCORING CONSTANTS
# ============================================================

class ScoringWeights:
    """Scoring weight configuration."""
    # Base weights for each detection layer
    MERCHANT_WEIGHT = 25.0
    INTENT_WEIGHT = 30.0
    CONTEXT_WEIGHT = 35.0
    KEYWORD_WEIGHT = 20.0

    # Modifiers
    POSITION_BONUS_START = 5.0      # Keyword at start of text
    POSITION_BONUS_EARLY = 3.0     # Keyword in first 15 chars
    EXACT_MATCH_BONUS = 10.0       # Exact phrase match
    AMBIGUOUS_PENALTY = 5.0        # Applied when category is uncertain
    NEGATIVE_PENALTY = 100.0       # Applied for negative rule match

    # Priority thresholds
    HIGH_PRIORITY_THRESHOLD = 50.0  # Above this = high confidence
    LOW_PRIORITY_THRESHOLD = 15.0  # Below this = low confidence


# ============================================================
# DEFAULT CATEGORIES (fallback)
# ============================================================

DEFAULT_EXPENSE_CATEGORY = "Chưa phân loại"
DEFAULT_INCOME_CATEGORY = "Chưa được phân loại"
DEFAULT_EXPENSE_ID = "uncategorized"
DEFAULT_INCOME_ID = "uncategorized_income"
