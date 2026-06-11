package com.examples.moneytracker.budget.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class BatchBudgetItemDto {
    @NotNull
    private UUID categoryId;

    @NotNull
    private Integer percent;

    @NotNull
    private BigDecimal amount;

    private String aiReasoning;
}
