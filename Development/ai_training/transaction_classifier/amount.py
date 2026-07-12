"""
Amount Extractor Module
====================
Extracts transaction amounts from Vietnamese text.

Supports various formats:
- 35k, 200k (thousands)
- 2tr, 2.5tr, 2tr5 (millions)
- 30 triệu, 100 nghìn
- 35ka, 1.5tr
- Plain numbers with context
"""

import re
from typing import Optional, Tuple


class AmountExtractor:
    """
    Extracts transaction amounts from text.

    Handles Vietnamese number formats:
    - Shortcuts: k (nghìn), tr (triệu)
    - Full forms: nghìn, triệu
    - Mixed: 2tr5 (2 triệu 500 nghìn)
    """

    # Pattern: (pattern, groups, converter)
    # For patterns with multiple groups, the converter receives the match groups
    PATTERNS = [
        # 2tr5 format: 2tr5 = 2,500,000
        (r'(\d+)\s*tr\s*(\d+)', None, lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),

        # 2.5tr format
        (r'(\d+)[.,](\d+)\s*tr\b', None, lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),

        # 2tr simple format
        (r'(\d+)\s*tr\b', None, lambda m: int(m.group(1)) * 1_000_000),

        # 2 triệu, 2.5 triệu format
        (r'(\d+)[.,](\d+)\s*(?:triệu|trieu|million)\b', None,
         lambda m: int(m.group(1)) * 1_000_000 + int(m.group(2)) * 100_000),
        (r'(\d+)\s*(?:triệu|trieu|million)\b', None, lambda m: int(m.group(1)) * 1_000_000),

        # 35.5ka, 35ka format
        (r'(\d+)[.,](\d+)\s*ka\b', None, lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),
        (r'(\d+)\s*ka\b', None, lambda m: int(m.group(1)) * 1_000),

        # 35.5k, 35k format
        (r'(\d+)[.,](\d+)\s*k\b', None, lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),
        (r'(\d+)\s*k\b', None, lambda m: int(m.group(1)) * 1_000),

        # 35.5 nghìn/nghin/ngàn format
        (r'(\d+)[.,](\d+)\s*(?:nghìn|nghin|ngàn|ngan)\b', None,
         lambda m: int(m.group(1)) * 1_000 + int(m.group(2)) * 100),
        (r'(\d+)\s*(?:nghìn|nghin|ngàn|ngan)\b', None, lambda m: int(m.group(1)) * 1_000),

        # nghìn X format
        (r'(?:nghìn|nghin|ngàn|ngan)\s*(?:đồng|dong|d)?\s*(\d+)', None, lambda m: int(m.group(1)) * 1_000),
    ]

    def __init__(self):
        """Initialize the amount extractor."""
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Compile regex patterns."""
        self._compiled = []
        for pattern, _, converter in self.PATTERNS:
            self._compiled.append((re.compile(pattern, re.IGNORECASE), converter))

    def extract(self, text: str) -> int:
        """
        Extract amount from text.

        Args:
            text: Input text

        Returns:
            Amount in VND (0 if no amount found)
        """
        text_lower = text.lower().strip()

        # Try all patterns
        for pattern, converter in self._compiled:
            match = pattern.search(text_lower)
            if match:
                try:
                    result = converter(match)
                    if result > 0:
                        return result
                except (ValueError, AttributeError, IndexError):
                    continue

        # Fallback: plain number (4-7 digits)
        match = re.search(r'\b(\d{4,7})\b', text_lower)
        if match:
            num = int(match.group(1))
            if num >= 1000:
                return num

        return 0

    def extract_with_context(self, text: str) -> Tuple[int, str]:
        """
        Extract amount and determine if it looks like an expense or income.

        Args:
            text: Input text

        Returns:
            Tuple of (amount, description)
        """
        amount = self.extract(text)

        # Determine context
        income_keywords = ['nhận', 'được', 'thưởng', 'lương', 'lãi', 'cổ tức', 'bán']
        expense_keywords = ['mua', 'ăn', 'đi', 'trả', 'tiêu', 'chi']

        text_lower = text.lower()
        if any(kw in text_lower for kw in income_keywords):
            context = "income"
        elif any(kw in text_lower for kw in expense_keywords):
            context = "expense"
        else:
            context = "unknown"

        return (amount, context)


# Global instance
amount_extractor = AmountExtractor()


def extract_amount(text: str) -> int:
    """Quick access to amount extraction."""
    return amount_extractor.extract(text)
