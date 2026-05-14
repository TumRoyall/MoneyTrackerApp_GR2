package com.examples.moneytracker.garden.service.score;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ScoreContext {
    private UUID userId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal savingsContribution;
    private BigDecimal debtPayment;
    private BigDecimal debtIncrease;
    private BigDecimal savingsRatio;
    private Map<LocalDate, BigDecimal> dailyExpenseTotals;
    private Map<String, BigDecimal> expenseByCategory;
    private List<BudgetUsage> budgetUsages;
    private int totalTasks;
    private int completedTasks;

    @Data
    @AllArgsConstructor
    public static class BudgetUsage {
        private UUID budgetId;
        private BigDecimal limit;
        private BigDecimal spent;
    }
}
