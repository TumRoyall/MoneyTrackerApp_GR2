package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.IntentResult;
import com.examples.moneytracker.ai.enums.IntentType;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Pattern;

@Service
public class RuleBasedIntentDetectionService implements IntentDetectionService {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?i)(\\d+[.,]?\\d*)\\s*(k|ngan|nghin|tr|trieu|m|million)?");

    @Override
    public IntentResult detectIntent(String text) {
        String lower = text == null ? "" : text.toLowerCase();

        if (lower.contains("budget") || lower.contains("ngan sach")) {
            return new IntentResult(IntentType.BUDGET_QUERY, 0.9, Map.of());
        }

        if (lower.contains("tieu nhieu nhat") || lower.contains("chi nhieu nhat") || lower.contains("top")) {
            return new IntentResult(IntentType.SPENDING_QUERY, 0.85, Map.of());
        }

        if (lower.contains("cuoi tuan") || lower.contains("insight")) {
            return new IntentResult(IntentType.INSIGHT_REQUEST, 0.8, Map.of());
        }

        if (AMOUNT_PATTERN.matcher(lower).find()) {
            return new IntentResult(IntentType.LOG_TRANSACTION, 0.7, Map.of());
        }

        return new IntentResult(IntentType.UNKNOWN, 0.3, Map.of());
    }
}
