package com.examples.moneytracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class AnalyticsSummaryDto {
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private String topCategoryName;
    private BigDecimal topCategoryAmount;
}
