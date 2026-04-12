package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateBudgetRequest {
    private UUID categoryId;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;
}
