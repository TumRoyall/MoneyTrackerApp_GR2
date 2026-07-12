"""
Main Transaction Classifier
========================
Orchestrates all classification layers to produce final category.

Pipeline:
    Input Text
        ↓
    Layer 1: Text Normalization
        ↓
    Layer 2: Merchant Detection
        ↓
    Layer 3: Intent Detection
        ↓
    Layer 4: Context Rule Evaluation
        ↓
    Layer 5: Keyword Matching (Fallback)
        ↓
    Layer 6: Negative Rule Application
        ↓
    Layer 7: Scoring & Ranking
        ↓
    Layer 8: Final Category
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .config import (
    CATEGORIES,
    CATEGORY_ID_MAP,
    CATEGORY_TYPE,
    DEFAULT_EXPENSE_CATEGORY,
    DEFAULT_INCOME_CATEGORY,
    TransactionType,
    ScoringWeights,
)
from .normalizer import TextNormalizer
from .merchants import MerchantDatabase, Merchant, LocationType
from .intents import IntentDetector, Intent, IntentInfo
from .context_rules import ContextRuleEngine, ContextRule
from .keywords import KeywordMatcher
from .negative_rules import NegativeRuleEngine
from .scoring import ScoringEngine, ScoringResult
from .amount import AmountExtractor


@dataclass
class ClassificationResult:
    """
    Complete result of transaction classification.

    Attributes:
        category: Final category name
        category_id: Backend category ID
        transaction_type: EXPENSE or INCOME
        confidence: Confidence score (0-1)
        amount: Extracted amount
        original_text: Original input text
        merchant: Detected merchant (if any)
        primary_intent: Detected primary intent
        all_intents: All detected intents
        scores: All category scores for debugging
        layers_used: List of layers that contributed
    """
    category: str
    category_id: str
    transaction_type: TransactionType
    confidence: float
    amount: int
    original_text: str
    merchant: Optional[str] = None
    primary_intent: Optional[str] = None
    all_intents: List[str] = field(default_factory=list)
    scores: Dict[str, float] = field(default_factory=dict)
    layers_used: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "category": self.category,
            "categoryId": self.category_id,
            "type": self.transaction_type.value,
            "confidence": round(self.confidence, 2),
            "amount": self.amount,
            "originalText": self.original_text,
            "merchant": self.merchant,
            "primaryIntent": self.primary_intent,
            "allIntents": self.all_intents,
            "layersUsed": self.layers_used,
        }


class TransactionClassifier:
    """
    Multi-layer transaction classifier.

    This is the main entry point for classifying transactions.
    It orchestrates all detection layers and produces a final classification.

    Usage:
        classifier = TransactionClassifier()
        result = classifier.classify("ăn phở 45k")
        print(result.category)  # "Thức ăn & Đồ uống"
    """

    def __init__(self):
        """Initialize the classifier with all sub-modules."""
        self.normalizer = TextNormalizer()
        self.merchant_db = MerchantDatabase()
        self.intent_detector = IntentDetector()
        self.context_engine = ContextRuleEngine()
        self.keyword_matcher = KeywordMatcher()
        self.negative_engine = NegativeRuleEngine()
        self.scoring_engine = ScoringEngine()
        self.amount_extractor = AmountExtractor()
        self.weights = ScoringWeights()

    def classify(self, text: str, debug: bool = False) -> ClassificationResult:
        """
        Classify a transaction.

        Args:
            text: Transaction text (e.g., "ăn phở 45k")
            debug: If True, include detailed debugging info

        Returns:
            ClassificationResult with category, confidence, etc.
        """
        if not text or not text.strip():
            return self._create_empty_result(text)

        original_text = text.strip()

        # ============================================================
        # LAYER 1: Text Normalization
        # ============================================================
        normalized = self.normalizer.normalize(text)
        layers_used = ["normalization"]

        # ============================================================
        # LAYER 2: Merchant Detection
        # ============================================================
        detected_merchant = self.merchant_db.detect(normalized)
        merchant_location = detected_merchant.location_type if detected_merchant else None
        layers_used.append("merchant_detection")

        # ============================================================
        # LAYER 3: Intent Detection
        # ============================================================
        intent_infos = self.intent_detector.detect(normalized)
        primary_intent_info = intent_infos[0] if intent_infos else IntentInfo(
            intent=Intent.UNKNOWN, confidence=0.0, matched_keywords=[]
        )
        primary_intent = primary_intent_info.intent
        layers_used.append("intent_detection")

        # ============================================================
        # LAYER 4: Context Rule Evaluation
        # ============================================================
        context_matches = self.context_engine.evaluate(
            normalized, primary_intent, merchant_location
        )

        # Extract context scores
        context_scores: Dict[str, float] = {}
        if context_matches:
            for rule, score in context_matches:
                cat = rule.category
                if cat not in context_scores or score > context_scores[cat]:
                    context_scores[cat] = score
        layers_used.append("context_rules")

        # ============================================================
        # LAYER 5: Keyword Matching (Fallback)
        # ============================================================
        keyword_matches = self.keyword_matcher.match(normalized)
        keyword_scores: Dict[str, Tuple[float, List[str]]] = keyword_matches
        layers_used.append("keyword_matching")

        # ============================================================
        # LAYER 6: Negative Rule Application
        # ============================================================
        # Get all candidate categories from context and keywords
        all_categories = set(context_scores.keys())
        for cat in keyword_scores.keys():
            all_categories.add(cat)

        # Apply negative rules
        filtered_categories, penalties = self.negative_engine.check(
            normalized, list(all_categories)
        )

        # Apply penalties
        for cat, penalty in penalties.items():
            if cat in context_scores:
                context_scores[cat] -= penalty
            if cat in keyword_scores:
                score, kws = keyword_scores[cat]
                keyword_scores[cat] = (score - penalty, kws)
        layers_used.append("negative_rules")

        # ============================================================
        # LAYER 7: Scoring & Ranking
        # ============================================================

        # Determine transaction type
        transaction_type = TransactionType.EXPENSE
        if self.intent_detector.is_income_intent(normalized):
            transaction_type = TransactionType.INCOME

        # Calculate final scores for each category
        scoring_results: Dict[str, ScoringResult] = {}

        # Score categories from context rules
        for cat, ctx_score in context_scores.items():
            if cat not in filtered_categories:
                continue

            # Get keyword score
            kw_score = keyword_scores.get(cat, (0.0, []))[0]

            # Get transaction type from context rule
            ctx_type = TransactionType.EXPENSE
            for rule, _ in context_matches:
                if rule.category == cat:
                    ctx_type = rule.transaction_type
                    break

            # Create scoring result
            result = self.scoring_engine.score_category(
                category=cat,
                transaction_type=ctx_type,
                merchant=detected_merchant,
                intent_info=primary_intent_info,
                context_score=ctx_score,
                keyword_score=kw_score,
                matched_keywords=keyword_scores.get(cat, (0.0, []))[1],
            )
            scoring_results[cat] = result

        # Score remaining keyword-only categories
        for cat, (kw_score, kws) in keyword_scores.items():
            if cat in scoring_results or cat not in filtered_categories:
                continue

            result = self.scoring_engine.score_category(
                category=cat,
                transaction_type=CATEGORY_TYPE.get(cat, TransactionType.EXPENSE),
                merchant=detected_merchant,
                intent_info=primary_intent_info,
                context_score=0.0,
                keyword_score=kw_score,
                matched_keywords=kws,
            )
            scoring_results[cat] = result

        # Rank by score
        ranked = self.scoring_engine.rank_categories(list(scoring_results.values()))

        # ============================================================
        # LAYER 8: Final Category Selection
        # ============================================================

        if ranked:
            best = ranked[0]

            # Adjust transaction type based on best result
            if best.transaction_type == TransactionType.INCOME:
                transaction_type = TransactionType.INCOME

            category = best.category
            confidence = best.confidence
            scores = {cat: result.total_score for cat, result in scoring_results.items()}
        else:
            # Fallback to keyword-based classification
            best_kw = self.keyword_matcher.get_best_category(normalized)
            category = best_kw[0]
            transaction_type = best_kw[1]
            confidence = best_kw[2] / 100.0 if best_kw[2] > 0 else 0.0
            scores = {cat: score for cat, (score, _) in keyword_scores.items()}

        # Get category ID
        category_id = CATEGORY_ID_MAP.get(category, "uncategorized")

        # Extract amount
        amount = self.amount_extractor.extract(original_text)

        return ClassificationResult(
            category=category,
            category_id=category_id,
            transaction_type=transaction_type,
            confidence=confidence,
            amount=amount,
            original_text=original_text,
            merchant=detected_merchant.name if detected_merchant else None,
            primary_intent=primary_intent.value if primary_intent != Intent.UNKNOWN else None,
            all_intents=[info.intent.value for info in intent_infos[:5]],
            scores=scores,
            layers_used=layers_used,
        )

    def _create_empty_result(self, text: str) -> ClassificationResult:
        """Create an empty result for invalid input."""
        return ClassificationResult(
            category=DEFAULT_EXPENSE_CATEGORY,
            category_id="uncategorized",
            transaction_type=TransactionType.EXPENSE,
            confidence=0.0,
            amount=0,
            original_text=text or "",
            layers_used=["none"],
        )

    def classify_batch(self, texts: List[str]) -> List[ClassificationResult]:
        """
        Classify multiple transactions.

        Args:
            texts: List of transaction texts

        Returns:
            List of ClassificationResults
        """
        return [self.classify(text) for text in texts]


def parse_transaction(text: str, debug: bool = False) -> dict:
    """
    Quick function to parse a transaction.

    Args:
        text: Transaction text
        debug: Include debug info

    Returns:
        Dictionary with parsed transaction data
    """
    classifier = TransactionClassifier()
    result = classifier.classify(text, debug=debug)
    return result.to_dict()


# Quick access function
_classifier = None

def get_classifier() -> TransactionClassifier:
    """Get or create a singleton classifier instance."""
    global _classifier
    if _classifier is None:
        _classifier = TransactionClassifier()
    return _classifier


def classify(text: str, debug: bool = False) -> ClassificationResult:
    """
    Classify a transaction using the singleton classifier.

    Args:
        text: Transaction text
        debug: Include debug info

    Returns:
        ClassificationResult
    """
    return get_classifier().classify(text, debug=debug)


def parse(text: str) -> dict:
    """
    Parse a transaction using the singleton classifier.

    Args:
        text: Transaction text

    Returns:
        Dictionary with parsed transaction data
    """
    return get_classifier().classify(text).to_dict()
