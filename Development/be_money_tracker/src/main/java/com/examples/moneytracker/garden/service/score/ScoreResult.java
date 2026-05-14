package com.examples.moneytracker.garden.service.score;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class ScoreResult {
    private int score;
    private int baseScore;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal savingsRatio;
    private int completedTasks;
    private int totalTasks;
    private List<ScoreContribution> contributions;
}
