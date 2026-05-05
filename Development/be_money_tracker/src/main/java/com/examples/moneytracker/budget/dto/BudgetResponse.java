package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetPeriodType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class BudgetResponse {
    private UUID budgetId;
    private UUID walletId;
    private UUID categoryId;
    private List<UUID> categoryIds;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;

    public static BudgetResponse from(Budget budget, BigDecimal spentAmount, BigDecimal remainingAmount, List<UUID> categoryIds) {
        return new BudgetResponse(
                budget.getBudgetId(),
                budget.getWalletId(),
                budget.getCategoryId(),
                categoryIds,
                budget.getAmountLimit(),
                budget.getPeriodStart(),
                budget.getPeriodEnd(),
                budget.getPeriodType(),
                budget.getAlertThreshold(),
                spentAmount,
                remainingAmount
        );
    }
}
