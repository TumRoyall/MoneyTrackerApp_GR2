package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetSummaryDto {
    private BigDecimal totalIncome;
    private Integer totalPercent;
    private BigDecimal totalBudget;
    private Integer savingsPercent;
    private BigDecimal savingsAmount;
    private String strategy;
}
