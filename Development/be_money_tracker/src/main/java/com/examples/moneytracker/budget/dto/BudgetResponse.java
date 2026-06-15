package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetPeriodType;
import com.examples.moneytracker.budget.model.BudgetSource;
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
    private String title;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private BudgetSource source;
    private String aiReasoning;
    private UUID draftId;

    public static BudgetResponse from(Budget budget, BigDecimal spentAmount, BigDecimal remainingAmount, List<UUID> categoryIds) {
        return new BudgetResponse(
                budget.getBudgetId(),
                budget.getWalletId(),
                categoryIds != null && !categoryIds.isEmpty() ? categoryIds.get(0) : null,
                categoryIds,
                budget.getTitle(),
                budget.getAmountLimit(),
                budget.getPeriodStart(),
                budget.getPeriodEnd(),
                budget.getPeriodType(),
                budget.getAlertThreshold(),
                spentAmount,
                remainingAmount,
                budget.getSource(),
                budget.getAiReasoning(),
                budget.getDraftId()
        );
    }
}
