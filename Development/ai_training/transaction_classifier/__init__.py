"""
Transaction Classifier - Multi-Layer Rule-Based System
======================================================

A production-ready, 100% offline transaction classifier designed for
React Native mobile apps. No ML, no LLM, no embeddings - just pure rules.

Architecture:
    Input Text
        ↓
    Layer 1: Text Normalization
        ↓
    Layer 2: Alias Mapping
        ↓
    Layer 3: Merchant Detection
        ↓
    Layer 4: Intent Detection
        ↓
    Layer 5: Context Rule Engine
        ↓
    Layer 6: Keyword Matching
        ↓
    Layer 7: Scoring & Conflict Resolution
        ↓
    Layer 8: Final Category

Author: Senior NLP Engineer
Version: 2.0.0
"""

from .config import (
    CATEGORIES,
    CATEGORY_ID_MAP,
    CATEGORY_TYPE,
    TransactionType,
)
from .classifier import TransactionClassifier, parse_transaction

__all__ = [
    "TransactionClassifier",
    "parse_transaction",
    "CATEGORIES",
    "CATEGORY_ID_MAP",
    "CATEGORY_TYPE",
    "TransactionType",
]

__version__ = "2.0.0"
