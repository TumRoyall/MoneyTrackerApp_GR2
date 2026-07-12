"""
JavaScript Exporter
================
Exports the classifier to JavaScript for React Native.

Run with:
    python exporter.py
"""

import json
import sys
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def export_config():
    """Export configuration data as JavaScript objects."""
    from transaction_classifier.config import (
        CATEGORY_ID_MAP,
        CATEGORY_TYPE,
        TransactionType,
    )

    # Export as dict (not JSON string)
    config = {
        "CATEGORY_ID_MAP": CATEGORY_ID_MAP,
        "CATEGORY_TYPE": {k: v.value for k, v in CATEGORY_TYPE.items()},
    }

    return config


def export_normalizer():
    """Export text normalizer patterns."""
    from transaction_classifier.normalizer import TextNormalizer

    normalizer = TextNormalizer()

    return {
        "ABBREVIATIONS": normalizer.ABBREVIATIONS,
    }


def export_merchants():
    """Export merchant database."""
    from transaction_classifier.merchants import MerchantDatabase, LocationType

    db = MerchantDatabase()
    merchants = []

    for merchant in db.get_all_merchants():
        merchants.append({
            "name": merchant.name,
            "aliases": merchant.aliases,
            "locationType": merchant.location_type.value,
            "possibleCategories": merchant.possible_categories,
        })

    return merchants


def export_intents():
    """Export intent dictionaries."""
    from transaction_classifier.intents import IntentDetector, Intent

    detector = IntentDetector()
    intents = {}

    for intent, keywords in detector._intents.items():
        intents[intent.value] = keywords

    return intents


def export_keyword_rules():
    """Export keyword rules."""
    from transaction_classifier.keywords import KeywordMatcher

    matcher = KeywordMatcher()
    rules = {}

    for rule in matcher._rules:
        cat = rule.category
        if cat not in rules:
            rules[cat] = {
                "keywords": [],
                "weight": rule.weight,
                "priority": rule.priority,
                "transactionType": rule.transaction_type.value,
            }
        rules[cat]["keywords"].extend(rule.keywords)

    return rules


def export_context_rules():
    """Export context rules."""
    from transaction_classifier.context_rules import ContextRuleEngine
    from transaction_classifier.intents import Intent
    from transaction_classifier.merchants import LocationType

    engine = ContextRuleEngine()
    rules = []

    for rule in engine._rules:
        rules.append({
            "intent": rule.intent.value if rule.intent else None,
            "locationType": rule.location_type.value if rule.location_type else None,
            "keywords": rule.keywords,
            "category": rule.category,
            "priority": rule.priority.value,
            "score": rule.score,
            "transactionType": rule.transaction_type.value,
            "description": rule.description,
        })

    return rules


def export_negative_rules():
    """Export negative rules."""
    from transaction_classifier.negative_rules import NegativeRuleEngine, NegativeRuleType

    engine = NegativeRuleEngine()
    rules = []

    for rule in engine._rules:
        rules.append({
            "keywords": rule.keywords,
            "excludedCategories": rule.excluded_categories,
            "ruleType": rule.rule_type.value,
            "penalty": rule.penalty,
            "description": rule.description,
        })

    return rules


def generate_javascript():
    """Generate complete JavaScript module."""

    config = export_config()
    merchants = export_merchants()
    intents = export_intents()
    keyword_rules = export_keyword_rules()
    context_rules = export_context_rules()
    negative_rules = export_negative_rules()

    js_code = '''
// Transaction Classifier - Multi-Layer Rule-Based System
// =======================================================
// Generated from Python implementation
// DO NOT EDIT MANUALLY - regenerate with exporter.py

// ============================================================
// CONFIGURATION
// ============================================================

export const CATEGORY_ID_MAP = ''' + json.dumps(config["CATEGORY_ID_MAP"], ensure_ascii=False, indent=4) + ''';

export const CATEGORY_TYPE = ''' + json.dumps(config["CATEGORY_TYPE"], ensure_ascii=False, indent=4) + ''';

export const TransactionType = {
    EXPENSE: "EXPENSE",
    INCOME: "INCOME"
};

// ============================================================
// TEXT NORMALIZATION
// ============================================================

const ABBREVIATIONS = ''' + json.dumps(export_normalizer()["ABBREVIATIONS"], ensure_ascii=False, indent=4) + ''';

function normalizeText(text) {
    if (!text) return "";

    // Lowercase
    let result = text.toLowerCase();

    // Expand abbreviations
    const sortedAbbrevs = Object.keys(ABBREVIATIONS).sort((a, b) => b.length - a.length);
    for (const abbrev of sortedAbbrevs) {
        const pattern = new RegExp('\\\\b' + escapeRegex(abbrev) + '\\\\b', 'gi');
        result = result.replace(pattern, ABBREVIATIONS[abbrev]);
    }

    // Normalize whitespace
    result = result.replace(/\\s+/g, ' ').trim();

    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

// ============================================================
// MERCHANT DATABASE
// ============================================================

const MERCHANTS = ''' + json.dumps(merchants, ensure_ascii=False, indent=4) + ''';

function detectMerchant(text) {
    const lower = text.toLowerCase();

    for (const merchant of MERCHANTS) {
        for (const alias of merchant.aliases) {
            if (lower.includes(alias)) {
                return merchant;
            }
        }
    }
    return null;
}

// ============================================================
// INTENT DETECTION
// ============================================================

const INTENTS = ''' + json.dumps(intents, ensure_ascii=False, indent=4) + ''';

function detectIntent(text) {
    const lower = text.toLowerCase();
    let bestIntent = null;
    let bestScore = 0;
    let matchedKeywords = [];

    for (const [intentName, keywords] of Object.entries(INTENTS)) {
        let score = 0;
        let matches = [];

        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) {
                matches.push(kw);
                score += kw.length;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestIntent = intentName;
            matchedKeywords = matches;
        }
    }

    return {
        intent: bestIntent,
        confidence: bestScore > 0 ? Math.min(bestScore / 50, 1) : 0,
        keywords: matchedKeywords
    };
}

// ============================================================
// CONTEXT RULES
// ============================================================

const CONTEXT_RULES = ''' + json.dumps(context_rules, ensure_ascii=False, indent=4) + ''';

function evaluateContextRules(text, intent, locationType) {
    const lower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const rule of CONTEXT_RULES) {
        let score = 0;
        let matches = true;

        // Check intent
        if (rule.intent && rule.intent !== intent) {
            matches = false;
        } else if (rule.intent === intent) {
            score += 30;
        }

        // Check location
        if (rule.locationType && rule.locationType !== locationType) {
            matches = false;
        } else if (rule.locationType === locationType) {
            score += 25;
        }

        // Check keywords
        let keywordMatches = 0;
        for (const kw of rule.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                keywordMatches++;
                score += 10 * (kw.length / 5);
            }
        }

        if (matches && (rule.keywords.length === 0 || keywordMatches > 0)) {
            score += rule.score + rule.priority * 5;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = rule;
            }
        }
    }

    return { rule: bestMatch, score: bestScore };
}

// ============================================================
// KEYWORD MATCHING
// ============================================================

const KEYWORD_RULES = ''' + json.dumps(keyword_rules, ensure_ascii=False, indent=4) + ''';

function matchKeywords(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [category, rule] of Object.entries(KEYWORD_RULES)) {
        let matchedKeywords = [];
        let score = 0;

        for (const kw of rule.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                matchedKeywords.push(kw);
                score += rule.weight * (kw.length / 5);
            }
        }

        if (matchedKeywords.length > 0) {
            // Position bonus
            for (const kw of matchedKeywords) {
                const pos = lower.indexOf(kw.toLowerCase());
                if (pos === 0) score += 5;
                else if (pos < 15) score += 3;
            }

            scores[category] = { score, keywords: matchedKeywords };
        }
    }

    return scores;
}

// ============================================================
// NEGATIVE RULES
// ============================================================

const NEGATIVE_RULES = ''' + json.dumps(negative_rules, ensure_ascii=False, indent=4) + ''';

function applyNegativeRules(text, categories) {
    const lower = text.toLowerCase();
    const filtered = [...categories];
    const penalties = {};

    for (const rule of NEGATIVE_RULES) {
        const matches = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));

        if (matches) {
            for (const cat of rule.excludedCategories) {
                const idx = filtered.indexOf(cat);
                if (idx !== -1 && rule.ruleType === 'hard_exclude') {
                    filtered.splice(idx, 1);
                } else if (rule.ruleType === 'soft_penalty') {
                    penalties[cat] = (penalties[cat] || 0) + rule.penalty;
                }
            }
        }
    }

    return { categories: filtered, penalties };
}

// ============================================================
// AMOUNT EXTRACTION
// ============================================================

const AMOUNT_PATTERNS = [
    // 2tr5 format
    { regex: /(\\d+)\\s*tr\\s*(\\d+)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    // 2.5tr format
    { regex: /(\\d+)[.,](\\d+)\\s*tr\\b/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    // 2tr format
    { regex: /(\\d+)\\s*tr\\b/i, convert: m => parseInt(m[1]) * 1000000 },
    // 2 triệu format
    { regex: /(\\d+)[.,](\\d+)\\s*(?:triệu|trieu|million)/i, convert: m => parseInt(m[1]) * 1000000 + parseInt(m[2]) * 100000 },
    { regex: /(\\d+)\\s*(?:triệu|trieu|million)\\b/i, convert: m => parseInt(m[1]) * 1000000 },
    // 35ka format
    { regex: /(\\d+)[.,](\\d+)\\s*ka\\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\\d+)\\s*ka\\b/i, convert: m => parseInt(m[1]) * 1000 },
    // 35k format
    { regex: /(\\d+)[.,](\\d+)\\s*k\\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\\d+)\\s*k\\b/i, convert: m => parseInt(m[1]) * 1000 },
    // 35 nghìn format
    { regex: /(\\d+)[.,](\\d+)\\s*(?:nghìn|nghin|ngàn|ngan)\\b/i, convert: m => parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 },
    { regex: /(\\d+)\\s*(?:nghìn|nghin|ngàn|ngan)\\b/i, convert: m => parseInt(m[1]) * 1000 },
];

function extractAmount(text) {
    const lower = text.toLowerCase().trim();

    for (const pattern of AMOUNT_PATTERNS) {
        const match = lower.match(pattern.regex);
        if (match) {
            try {
                const result = pattern.convert(match);
                if (result > 0) return result;
            } catch (e) {
                continue;
            }
        }
    }

    // Fallback: plain number (4-7 digits)
    const numMatch = lower.match(/\\b(\\d{4,7})\\b/);
    if (numMatch && parseInt(numMatch[1]) >= 1000) {
        return parseInt(numMatch[1]);
    }

    return 0;
}

// ============================================================
// MAIN CLASSIFIER
// ============================================================

function classifyTransaction(text) {
    if (!text || !text.trim()) {
        return {
            category: "Chưa phân loại",
            categoryId: "uncategorized",
            type: "EXPENSE",
            confidence: 0,
            amount: 0,
            originalText: text || "",
        };
    }

    const originalText = text.trim();

    // Layer 1: Normalization
    const normalized = normalizeText(originalText);

    // Layer 2: Merchant Detection
    const merchant = detectMerchant(normalized);
    const locationType = merchant ? merchant.locationType : null;

    // Layer 3: Intent Detection
    const intentInfo = detectIntent(normalized);
    const primaryIntent = intentInfo.intent;

    // Layer 4: Context Rules
    const contextResult = evaluateContextRules(normalized, primaryIntent, locationType);
    const contextScore = contextResult.score;
    const contextCategory = contextResult.rule ? contextResult.rule.category : null;

    // Layer 5: Keyword Matching
    const keywordScores = matchKeywords(normalized);

    // Layer 6: Negative Rules
    const allCategories = new Set();
    if (contextCategory) allCategories.add(contextCategory);
    for (const cat of Object.keys(keywordScores)) allCategories.add(cat);

    const { categories: filteredCategories, penalties } = applyNegativeRules(
        normalized,
        Array.from(allCategories)
    );

    // Determine transaction type from intent
    let transactionType = "EXPENSE";
    const incomeIntents = ["income", "salary", "investment", "bonus", "business"];
    if (primaryIntent && incomeIntents.includes(primaryIntent)) {
        transactionType = "INCOME";
    }

    // Calculate final scores
    let bestCategory = contextCategory || "Chưa phân loại";
    let bestScore = contextScore;

    // Check keyword scores
    for (const [category, { score, keywords }] of Object.entries(keywordScores)) {
        const penalty = penalties[category] || 0;
        const adjustedScore = score - penalty;

        if (adjustedScore > bestScore && filteredCategories.includes(category)) {
            bestScore = adjustedScore;
            bestCategory = category;
        }
    }

    // Fallback to uncategorized if no match
    if (!filteredCategories.includes(bestCategory)) {
        bestCategory = "Chưa phân loại";
    }

    // Get category ID
    const categoryId = CATEGORY_ID_MAP[bestCategory] || "uncategorized";

    // Calculate confidence
    const confidence = Math.min(bestScore / 100, 1);

    // Extract amount
    const amount = extractAmount(originalText);

    return {
        category: bestCategory,
        categoryId: categoryId,
        type: transactionType,
        confidence: Math.round(confidence * 100) / 100,
        amount: amount,
        originalText: originalText,
        merchant: merchant ? merchant.name : null,
        primaryIntent: primaryIntent,
        layersUsed: ["normalization", "merchant_detection", "intent_detection", "context_rules", "keyword_matching", "negative_rules"],
    };
}

// Named export for default
export default classifyTransaction;

// Also export individual functions for advanced usage
export {
    normalizeText,
    detectMerchant,
    detectIntent,
    evaluateContextRules,
    matchKeywords,
    applyNegativeRules,
    extractAmount,
    CATEGORY_ID_MAP,
    CATEGORY_TYPE,
    TransactionType,
};
'''

    return js_code


def main():
    """Generate and save JavaScript module."""
    output_path = Path(__file__).parent / "transaction_classifier.js"

    js_code = generate_javascript()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_code)

    print(f"✅ Generated JavaScript module: {output_path}")
    print(f"   Size: {len(js_code):,} bytes")


if __name__ == "__main__":
    main()
