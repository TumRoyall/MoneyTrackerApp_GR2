package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ReportBudgetHealthResponse {
    private List<BudgetHealthItem> budgets;
}
