package com.examples.moneytracker.budget.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class BatchCreateBudgetResponse {
    private List<BudgetResponse> budgets;
}
