package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateBudgetRequest {
    @NotNull
    private UUID walletId;

    @NotNull
    private UUID categoryId;

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
