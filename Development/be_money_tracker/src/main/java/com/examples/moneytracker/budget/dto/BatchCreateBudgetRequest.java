package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BatchCreateBudgetRequest {
    @NotNull
    private UUID draftId;

    // null = applies to all wallets
    private UUID walletId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;

    @NotNull
    private BudgetPeriodType periodType;

    @NotNull
    @Positive
    private BigDecimal income;

    @NotEmpty
    @Valid
    private List<BatchBudgetItemDto> items;
}
