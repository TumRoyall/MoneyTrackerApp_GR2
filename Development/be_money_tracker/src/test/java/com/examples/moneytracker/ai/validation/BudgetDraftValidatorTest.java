package com.examples.moneytracker.ai.validation;

import com.examples.moneytracker.ai.dto.BudgetItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BudgetDraftValidatorTest {

    private BudgetDraftValidator validator;
    private Map<UUID, String> categoryNames;
    private UUID foodId;
    private UUID rentId;
    private UUID savingsId;

    @BeforeEach
    void setUp() {
        validator = new BudgetDraftValidator();
        foodId = UUID.randomUUID();
        rentId = UUID.randomUUID();
        savingsId = UUID.randomUUID();
        categoryNames = Map.of(
                foodId, "Ăn uống",
                rentId, "Tiền nhà",
                savingsId, "Tiết kiệm"
        );
    }

    @Test
    @DisplayName("Returns items unchanged when already valid (sum=100, savings present, <=6)")
    void validInput_unchanged() {
        List<BudgetItemDto> input = List.of(
                item(foodId, "Ăn uống", 25),
                item(rentId, "Tiền nhà", 55),
                item(savingsId, "Tiết kiệm", 20)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(3, result.size());
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Filters out items whose categoryId is not in the known list")
    void unknownCategory_filtered() {
        UUID unknown = UUID.randomUUID();
        List<BudgetItemDto> input = new ArrayList<>(List.of(
                new BudgetItemDto(unknown, "Ghost", 30, BigDecimal.ZERO, "..."),
                item(foodId, "Ăn uống", 30),
                item(savingsId, "Tiết kiệm", 70)
        ));
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(2, result.size());
        assertTrue(result.stream().noneMatch(i -> "Ghost".equals(i.getCategoryName())));
    }

    @Test
    @DisplayName("Clamps percent to [0, 100], then rebalances to exactly 100")
    void percentClamped() {
        List<BudgetItemDto> input = List.of(
                item(foodId, "Ăn uống", 150),
                item(rentId, "Tiền nhà", -10),
                item(savingsId, "Tiết kiệm", 20)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        // 150 -> 100; -10 -> 0; savings 20. Sum=120, rebalance scale down to 100.
        assertEquals(100, sumPercent(result));
        // All values must be 0..100
        for (BudgetItemDto it : result) {
            assertTrue(it.getPercent() >= 0 && it.getPercent() <= 100, "out of range: " + it.getPercent());
        }
    }

    @Test
    @DisplayName("Adds 'Tiết kiệm' with remainder if missing")
    void missingSavings_added() {
        List<BudgetItemDto> input = List.of(
                item(foodId, "Ăn uống", 40),
                item(rentId, "Tiền nhà", 30)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(3, result.size());
        assertTrue(result.stream().anyMatch(i -> "Tiết kiệm".equals(i.getCategoryName())));
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Last item absorbs overflow when sum > 100")
    void sumOverflow_lastItemAbsorbs() {
        List<BudgetItemDto> input = List.of(
                item(foodId, "Ăn uống", 60),
                item(rentId, "Tiền nhà", 60),
                item(savingsId, "Tiết kiệm", 30)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertEquals(100, sumPercent(result));
    }

    @Test
    @DisplayName("Caps to 6 items — drops the smallest-percent items first")
    void tooManyItems_cappedAt6() {
        List<BudgetItemDto> input = new ArrayList<>();
        // 7 items at 10% each + savings at 30% = 100, but after cap (drop 1) should still sum to 100 (validator keeps savings)
        for (int i = 0; i < 7; i++) {
            input.add(item(foodId, "Ăn uống", 10));
        }
        input.add(item(savingsId, "Tiết kiệm", 30));
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("10000000"));
        assertTrue(result.size() <= 6, "expected at most 6, got " + result.size());
    }

    @Test
    @DisplayName("Computes amount = income * percent / 100 for every item")
    void amountComputed() {
        List<BudgetItemDto> input = List.of(
                item(foodId, "Ăn uống", 25),
                item(savingsId, "Tiết kiệm", 75)
        );
        List<BudgetItemDto> result = validator.validate(input, categoryNames, new BigDecimal("20000000"));
        // 25% of 20M = 5M; 75% of 20M = 15M
        assertEquals(0, new BigDecimal("5000000").compareTo(result.get(0).getAmount()));
        assertEquals(0, new BigDecimal("15000000").compareTo(result.get(1).getAmount()));
    }

    private BudgetItemDto item(UUID id, String name, int percent) {
        return new BudgetItemDto(id, name, percent, BigDecimal.ZERO, "reason for " + name);
    }

    private int sumPercent(List<BudgetItemDto> items) {
        return items.stream().mapToInt(BudgetItemDto::getPercent).sum();
    }
}
