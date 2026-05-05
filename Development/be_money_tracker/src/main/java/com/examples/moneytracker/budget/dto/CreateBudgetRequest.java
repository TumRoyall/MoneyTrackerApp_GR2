package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class CreateBudgetRequest {
    @NotNull
    private UUID walletId;

    private UUID categoryId;

    // Support multiple categories for a budget. If provided, at least one category must be present.
    private List<UUID> categoryIds;

    @NotNull
    private BigDecimal amountLimit;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;

    @NotNull
    private BudgetPeriodType periodType;

    private BigDecimal alertThreshold;
}
