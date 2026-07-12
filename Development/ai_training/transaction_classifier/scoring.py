"""
Scoring Engine Module
===================
Weighted scoring system for combining multiple classification signals.

The scoring engine combines:
- Merchant scores
- Intent scores
- Context rule scores
- Keyword scores

Then applies modifiers for:
- Position bonuses
- Negative rule penalties
- Ambiguity penalties
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

from .config import (
    CATEGORY_TYPE,
    TransactionType,
    ScoringWeights,
)
from .intents import Intent, IntentInfo
from .merchants import Merchant, LocationType


@dataclass
class ScoringResult:
    """
    Result of scoring a transaction against a category.

    Attributes:
        category: Category name
        transaction_type: EXPENSE or INCOME
        total_score: Final weighted score
        merchant_score: Score from merchant detection
        intent_score: Score from intent detection
        context_score: Score from context rules
        keyword_score: Score from keyword matching
        confidence: Confidence level (0-1)
        matched_keywords: List of keywords that matched
        matched_intents: List of intents detected
        matched_merchant: Merchant detected (if any)
    """
    category: str
    transaction_type: TransactionType
    total_score: float
    merchant_score: float = 0.0
    intent_score: float = 0.0
    context_score: float = 0.0
    keyword_score: float = 0.0
    confidence: float = 0.0
    matched_keywords: List[str] = field(default_factory=list)
    matched_intents: List[Intent] = field(default_factory=list)
    matched_merchant: Optional[str] = None
    is_negative: bool = False

    def to_dict(self) -> dict:
        """Convert to dictionary for debugging."""
        return {
            "category": self.category,
            "type": self.transaction_type.value,
            "total_score": self.total_score,
            "merchant_score": self.merchant_score,
            "intent_score": self.intent_score,
            "context_score": self.context_score,
            "keyword_score": self.keyword_score,
            "confidence": self.confidence,
            "matched_keywords": self.matched_keywords,
            "matched_intents": [i.value for i in self.matched_intents],
            "matched_merchant": self.matched_merchant,
            "is_negative": self.is_negative,
        }


class ScoringEngine:
    """
    Weighted scoring engine for transaction classification.

    The engine combines multiple signals:
    1. Merchant detection (25% weight)
    2. Intent detection (30% weight)
    3. Context rules (35% weight)
    4. Keyword matching (20% weight)

    Final score = weighted sum with modifiers
    """

    def __init__(self):
        """Initialize the scoring engine."""
        self.weights = ScoringWeights()

    def calculate_merchant_score(
        self,
        merchant: Optional[Merchant],
        category: str
    ) -> float:
        """
        Calculate score contribution from merchant detection.

        Args:
            merchant: Detected merchant
            category: Target category

        Returns:
            Merchant score contribution
        """
        if merchant is None:
            return 0.0

        # Base score for detecting a merchant
        base_score = self.weights.MERCHANT_WEIGHT

        # Bonus if category is in merchant's possible categories
        if category in merchant.possible_categories:
            base_score += 15.0

        # Bonus for location type match
        # (This is used by context rules, not here)

        return base_score

    def calculate_intent_score(
        self,
        intent_info: IntentInfo,
        category: str
    ) -> float:
        """
        Calculate score contribution from intent detection.

        Args:
            intent_info: Detected intent info
            category: Target category

        Returns:
            Intent score contribution
        """
        if intent_info.confidence == 0:
            return 0.0

        # Base score scaled by confidence
        base = self.weights.INTENT_WEIGHT * intent_info.confidence

        # Category-specific intent mapping
        intent_category_map = {
            Intent.FOOD: ["Thức ăn & Đồ uống"],
            Intent.BUY: ["Mua sắm", "Thực phẩm", "Điện tử"],
            Intent.TRANSPORT: ["Giao thông"],
            Intent.PARK: ["Giao thông"],
            Intent.PAY: ["Nhà", "Nợ"],
            Intent.HEALTH: ["Sức khỏe"],
            Intent.ENTERTAINMENT: ["Giải trí"],
            Intent.HOME: ["Nhà"],
            Intent.TRAVEL: ["Du lịch"],
            Intent.EDUCATION: ["Giáo dục"],
            Intent.INVEST: ["Tiết kiệm"],
            Intent.PET: ["Thú cưng"],
            Intent.BEAUTY: ["Làm đẹp"],
            Intent.SPORTS: ["Thể thao"],
            Intent.INCOME: ["Lương", "Tiền thưởng", "Đầu tư", "Kinh doanh"],
        }

        # Bonus if intent matches category
        matching_categories = intent_category_map.get(intent_info.intent, [])
        if category in matching_categories:
            base += 20.0

        # Bonus for multiple keyword matches
        if len(intent_info.matched_keywords) > 1:
            base += len(intent_info.matched_keywords) * 5.0

        return base

    def apply_negative_penalty(
        self,
        scores: Dict[str, ScoringResult],
        negative_keywords: Dict[str, Set[str]],
        text: str
    ) -> None:
        """
        Apply negative keyword penalties to scores.

        Negative keywords disqualify or heavily penalize categories.

        Args:
            scores: Dictionary of category -> ScoringResult
            negative_keywords: Dict of category -> set of negative keywords
            text: Original text for checking
        """
        text_lower = text.lower()

        for category, neg_keywords in negative_keywords.items():
            if category in scores:
                for neg_kw in neg_keywords:
                    if neg_kw.lower() in text_lower:
                        scores[category].is_negative = True
                        scores[category].total_score -= self.weights.NEGATIVE_PENALTY
                        break

    def calculate_final_score(
        self,
        merchant_score: float,
        intent_score: float,
        context_score: float,
        keyword_score: float,
        is_negative: bool = False
    ) -> Tuple[float, float]:
        """
        Calculate final combined score and confidence.

        Args:
            merchant_score: Score from merchant detection
            intent_score: Score from intent detection
            context_score: Score from context rules
            keyword_score: Score from keyword matching
            is_negative: Whether negative rules triggered

        Returns:
            Tuple of (final_score, confidence)
        """
        if is_negative:
            return (0.0, 0.0)

        # Weighted sum
        total = (
            merchant_score * (self.weights.MERCHANT_WEIGHT / 100.0) +
            intent_score * (self.weights.INTENT_WEIGHT / 100.0) +
            context_score * (self.weights.CONTEXT_WEIGHT / 100.0) +
            keyword_score * (self.weights.KEYWORD_WEIGHT / 100.0)
        )

        # Calculate confidence based on score magnitude and signal strength
        max_possible = (
            self.weights.MERCHANT_WEIGHT +
            self.weights.INTENT_WEIGHT +
            self.weights.CONTEXT_WEIGHT +
            self.weights.KEYWORD_WEIGHT
        )

        confidence = min(total / max_possible * 2, 1.0)  # Scale to 0-1

        return (total, confidence)

    def score_category(
        self,
        category: str,
        transaction_type: TransactionType,
        merchant: Optional[Merchant],
        intent_info: IntentInfo,
        context_score: float,
        keyword_score: float,
        matched_keywords: List[str],
        is_negative: bool = False
    ) -> ScoringResult:
        """
        Calculate complete score for a category.

        Args:
            category: Category name
            transaction_type: EXPENSE or INCOME
            merchant: Detected merchant
            intent_info: Detected intent
            context_score: Score from context rules
            keyword_score: Score from keyword matching
            matched_keywords: Keywords that matched
            is_negative: Whether negative rules triggered

        Returns:
            Complete ScoringResult
        """
        # Calculate component scores
        m_score = self.calculate_merchant_score(merchant, category)
        i_score = self.calculate_intent_score(intent_info, category)

        # Final score and confidence
        total, confidence = self.calculate_final_score(
            m_score, i_score, context_score, keyword_score, is_negative
        )

        return ScoringResult(
            category=category,
            transaction_type=transaction_type,
            total_score=total,
            merchant_score=m_score,
            intent_score=i_score,
            context_score=context_score,
            keyword_score=keyword_score,
            confidence=confidence,
            matched_keywords=matched_keywords,
            matched_intents=[intent_info.intent] if intent_info.intent != Intent.UNKNOWN else [],
            matched_merchant=merchant.name if merchant else None,
            is_negative=is_negative,
        )

    def rank_categories(
        self,
        scores: List[ScoringResult]
    ) -> List[ScoringResult]:
        """
        Rank categories by total score.

        Args:
            scores: List of ScoringResults

        Returns:
            Sorted list (highest score first)
        """
        # Filter out negative results
        valid_scores = [s for s in scores if not s.is_negative]

        # Sort by total score
        valid_scores.sort(key=lambda x: x.total_score, reverse=True)

        return valid_scores


# Global scoring engine instance
scoring_engine = ScoringEngine()


def calculate_score(
    merchant_score: float,
    intent_score: float,
    context_score: float,
    keyword_score: float
) -> Tuple[float, float]:
    """Quick access to score calculation."""
    return scoring_engine.calculate_final_score(
        merchant_score, intent_score, context_score, keyword_score
    )
