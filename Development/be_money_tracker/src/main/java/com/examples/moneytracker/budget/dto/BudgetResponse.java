package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetPeriodType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class BudgetResponse {
    private UUID budgetId;
    private UUID categoryId;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;

    public static BudgetResponse from(Budget budget) {
        return new BudgetResponse(
                budget.getBudgetId(),
                budget.getCategoryId(),
                budget.getAmountLimit(),
                budget.getPeriodStart(),
                budget.getPeriodEnd(),
                budget.getPeriodType(),
                budget.getAlertThreshold()
        );
    }
}
