package com.examples.moneytracker.ai.validation;

import com.examples.moneytracker.ai.dto.BudgetItemDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class BudgetDraftValidator {

    private static final int MAX_ITEMS = 6;
    private static final String SAVINGS_NAME = "Tiết kiệm";

    /**
     * Filters unknown categories, clamps percent 0-100, ensures "Tiết kiệm" present,
     * caps to MAX_ITEMS, and rebalances percent so total = 100.
     */
    public List<BudgetItemDto> validate(
            List<BudgetItemDto> raw,
            Map<UUID, String> knownCategoryNames,
            BigDecimal income
    ) {
        // 1. Filter to known categories + clamp percent
        List<BudgetItemDto> filtered = new ArrayList<>();
        for (BudgetItemDto item : raw) {
            if (item.getCategoryId() == null) {
                continue;
            }
            String name = knownCategoryNames.get(item.getCategoryId());
            if (name == null) {
                continue;
            }
            int clamped = Math.max(0, Math.min(100, item.getPercent() == null ? 0 : item.getPercent()));
            filtered.add(new BudgetItemDto(
                    item.getCategoryId(),
                    name,
                    clamped,
                    BigDecimal.ZERO,
                    item.getAiReasoning()
            ));
        }

        // 2. Ensure "Tiết kiệm" present (look up by name; first match wins)
        boolean hasSavings = filtered.stream().anyMatch(i -> SAVINGS_NAME.equals(i.getCategoryName()));
        if (!hasSavings) {
            UUID savingsId = knownCategoryNames.entrySet().stream()
                    .filter(e -> SAVINGS_NAME.equals(e.getValue()))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
            if (savingsId != null) {
                filtered.add(new BudgetItemDto(savingsId, SAVINGS_NAME, 0, BigDecimal.ZERO, "Auto-fill savings"));
            }
        }

        // 3. Cap to MAX_ITEMS — drop smallest first
        if (filtered.size() > MAX_ITEMS) {
            filtered.sort(Comparator.comparingInt(BudgetItemDto::getPercent).reversed());
            filtered = new ArrayList<>(filtered.subList(0, MAX_ITEMS));
        }

        // 4. Rebalance to sum=100. Distribute diff proportionally to ensure exact 100.
        int total = filtered.stream().mapToInt(BudgetItemDto::getPercent).sum();
        if (total != 100 && total > 0 && !filtered.isEmpty()) {
            // Proportional scale: each item gets share = round(percent * 100 / total).
            int sumRounded = 0;
            int[] adjusted = new int[filtered.size()];
            for (int i = 0; i < filtered.size(); i++) {
                int orig = filtered.get(i).getPercent();
                int newVal = (int) Math.round((double) orig * 100 / total);
                adjusted[i] = newVal;
                sumRounded += newVal;
            }
            // Adjust rounding error: add/subtract 1 from largest items
            int drift = 100 - sumRounded;
            if (drift != 0) {
                // find index of largest item
                int maxIdx = 0;
                for (int i = 1; i < adjusted.length; i++) {
                    if (adjusted[i] > adjusted[maxIdx]) maxIdx = i;
                }
                adjusted[maxIdx] = Math.max(0, Math.min(100, adjusted[maxIdx] + drift));
            }
            List<BudgetItemDto> rebalanced = new ArrayList<>();
            for (int i = 0; i < filtered.size(); i++) {
                BudgetItemDto it = filtered.get(i);
                rebalanced.add(new BudgetItemDto(
                        it.getCategoryId(), it.getCategoryName(),
                        adjusted[i], BigDecimal.ZERO, it.getAiReasoning()
                ));
            }
            filtered = rebalanced;
        }

        // 5. Compute amount = income * percent / 100
        if (income != null && income.signum() > 0) {
            List<BudgetItemDto> withAmount = new ArrayList<>(filtered.size());
            for (BudgetItemDto i : filtered) {
                BigDecimal amount = income
                        .multiply(BigDecimal.valueOf(i.getPercent()))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                withAmount.add(new BudgetItemDto(
                        i.getCategoryId(),
                        i.getCategoryName(),
                        i.getPercent(),
                        amount,
                        i.getAiReasoning()
                ));
            }
            return withAmount;
        }
        return filtered;
    }
}
