package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class BudgetHealthItem {
    private UUID budgetId;
    private UUID categoryId;
    private BigDecimal spent;
    private BigDecimal limit;
    private BigDecimal ratio;
}
