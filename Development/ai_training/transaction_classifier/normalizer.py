"""
Text Normalization Module
========================
Handles Vietnamese text normalization, including:
- Unicode normalization (NFC/NFD)
- Case folding
- Whitespace normalization
- Special character handling
- Common abbreviation expansion
- Number word conversion
"""

import re
import unicodedata
from typing import Dict, List, Tuple


class TextNormalizer:
    """
    Text normalizer for Vietnamese transaction text.

    Normalization steps:
    1. Unicode NFC normalization
    2. Convert to lowercase
    3. Normalize whitespace and punctuation
    4. Expand abbreviations
    5. Normalize numbers
    6. Normalize special characters
    """

    # Common Vietnamese abbreviations and variations
    ABBREVIATIONS: Dict[str, str] = {
        # Coffee shops
        "cf": "cafe",
        "caphe": "cafe",
        "càfe": "cafe",
        "cà phê": "cafe",
        "café": "cafe",

        # Shopping platforms
        "grabfood": "grab food",
        "grab bike": "grabbike",
        "grabbike": "grab bike",
        "grabtaxi": "grab taxi",
        "grabcar": "grab car",

        # Mall names
        "royalcity": "royal city",
        "royal city": "royal city",
        "vincom": "vincom",
        "aeonmall": "aeon mall",
        "aeon mall": "aeon mall",
        "lottemart": "lotte mart",
        "lotte mart": "lotte mart",
        "vinmart": "vinmart",
        "winmart": "winmart",

        # Food/drink variations
        "trasua": "tra sua",
        "trà sữa": "tra sua",
        "tra sua": "tra sua",
        "tra chanh": "tra chanh",
        "tra dao": "tra dao",
        "ca phe": "ca phe",
        "cà phê": "ca phe",
        "cf": "ca phe",

        # Transport
        "xe may": "xe may",
        "xe máy": "xe may",
        "xe may": "xe may",
        "xehoi": "xe hoi",
        "xe hơi": "xe hoi",
        "oto": "oto",
        "ô tô": "oto",

        # Common words
        "vs": "voi",
        "vs": "voi",
        "dc": "duoc",
        "ko": "khong",
        "k": "khong",
        "kh": "khong",
        "bt": "binh thuong",
        "mn": "moi nguoi",
        "qt": "qua tang",
        "q": "quá",
        "z": "vậy",
        "f": "phí",
        "f": "phí",
        "dp": "điện thoại",

        # Numbers
        "k": "nghin",
        "tr": "trieu",
        "trieu": "trieu",
        "nghin": "nghin",
        "ngàn": "nghin",

        # Misc
        "nv": "nhan vien",
        "tv": "thanh vien",
        "kh": "khach hang",
        "ms": "mã số",
        "tn": "tong nabv",
    }

    # Patterns for whitespace and punctuation normalization
    WHITESPACE_PATTERN = re.compile(r'\s+')
    PUNCTUATION_PATTERN = re.compile(r'[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]')

    # Number words to digits
    NUMBER_WORDS: Dict[str, str] = {
        "một": "1", "một": "1", "hai": "2", "ba": "3", "bốn": "4",
        "năm": "5", "sáu": "6", "bảy": "7", "tám": "8", "chín": "9",
        "mười": "10", "mươi": "10", "trăm": "100", "nghìn": "1000",
        "triệu": "1000000", "tỷ": "1000000000",
    }

    def __init__(self):
        """Initialize the normalizer."""
        self._abbreviation_pattern = self._build_abbreviation_pattern()

    def _build_abbreviation_pattern(self) -> re.Pattern:
        """Build regex pattern for abbreviation matching."""
        # Sort by length descending to match longer patterns first
        sorted_abbrevs = sorted(self.ABBREVIATIONS.keys(), key=len, reverse=True)
        pattern = '|'.join(re.escape(k) for k in sorted_abbrevs)
        return re.compile(pattern, re.IGNORECASE)

    def normalize(self, text: str) -> str:
        """
        Normalize input text.

        Args:
            text: Raw input text

        Returns:
            Normalized text ready for matching
        """
        if not text:
            return ""

        # Step 1: Unicode NFC normalization
        text = unicodedata.normalize('NFC', text)

        # Step 2: Convert to lowercase
        text = text.lower()

        # Step 3: Expand abbreviations
        text = self._expand_abbreviations(text)

        # Step 4: Normalize whitespace
        text = self.WHITESPACE_PATTERN.sub(' ', text)

        # Step 5: Strip leading/trailing whitespace
        text = text.strip()

        return text

    def _expand_abbreviations(self, text: str) -> str:
        """Expand known abbreviations."""
        # Use function-based replacement to handle overlapping patterns
        result = text
        for abbrev, expansion in sorted(self.ABBREVIATIONS.items(), key=lambda x: len(x[0]), reverse=True):
            # Use word boundary matching for short abbreviations
            if len(abbrev) <= 3:
                pattern = r'\b' + re.escape(abbrev) + r'\b'
                result = re.sub(pattern, expansion, result, flags=re.IGNORECASE)
            else:
                result = result.replace(abbrev.lower(), expansion)
        return result

    def normalize_for_matching(self, text: str) -> str:
        """
        Normalize text specifically for keyword/pattern matching.
        More aggressive normalization than standard normalize().
        """
        text = self.normalize(text)

        # Additional normalization for matching
        # Remove special characters but keep Vietnamese letters
        text = self.PUNCTUATION_PATTERN.sub(' ', text)

        # Normalize repeated characters (e.g., "hết hết" -> "hết")
        text = re.sub(r'(.)\1+', r'\1', text)

        # Normalize whitespace again
        text = self.WHITESPACE_PATTERN.sub(' ', text)
        text = text.strip()

        return text

    def extract_tokens(self, text: str) -> List[str]:
        """
        Tokenize normalized text.

        Args:
            text: Normalized text

        Returns:
            List of tokens
        """
        normalized = self.normalize(text)
        return normalized.split()

    def get_ngrams(self, text: str, n: int = 2) -> List[str]:
        """
        Generate n-grams from text for phrase matching.

        Args:
            text: Normalized text
            n: N-gram size

        Returns:
            List of n-grams
        """
        normalized = self.normalize(text)
        tokens = normalized.split()
        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngrams.append(' '.join(tokens[i:i + n]))
        return ngrams

    def highlight_keywords(self, text: str, keywords: List[str]) -> List[Tuple[str, bool]]:
        """
        Check which keywords appear in text.

        Args:
            text: Input text
            keywords: List of keywords to check

        Returns:
            List of (keyword, found) tuples
        """
        normalized = self.normalize(text)
        results = []
        for kw in keywords:
            kw_normalized = self.normalize(kw)
            found = kw_normalized in normalized
            results.append((kw, found))
        return results


# Global normalizer instance
normalizer = TextNormalizer()


def normalize(text: str) -> str:
    """Quick access to text normalization."""
    return normalizer.normalize(text)


def normalize_for_matching(text: str) -> str:
    """Quick access to aggressive normalization for matching."""
    return normalizer.normalize_for_matching(text)
