package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class TimeSeriesPoint {
    private String period;
    private BigDecimal totalExpense;
    private BigDecimal totalIncome;
}
