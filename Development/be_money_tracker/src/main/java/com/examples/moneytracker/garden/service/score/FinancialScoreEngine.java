package com.examples.moneytracker.garden.service.score;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinancialScoreEngine {

    private static final int BASE_SCORE = 50;

    private final ScoreContextFactory contextFactory;
    private final List<ScoreRule> rules;

    public ScoreResult calculateMonthlyScore(UUID userId, LocalDate monthStart, LocalDate monthEnd) {
        ScoreContext context = contextFactory.build(userId, monthStart, monthEnd);
        List<ScoreRule> orderedRules = rules.stream()
            .sorted(Comparator.comparingInt(ScoreRule::order))
            .toList();

        int score = BASE_SCORE;
        var contributions = new java.util.ArrayList<ScoreContribution>();
        for (ScoreRule rule : orderedRules) {
            ScoreContribution contribution = rule.evaluate(context);
            contributions.add(contribution);
            score += contribution.getDelta();
        }

        score = Math.max(0, Math.min(100, score));

        return new ScoreResult(
            score,
            BASE_SCORE,
            context.getTotalIncome(),
            context.getTotalExpense(),
            context.getSavingsRatio(),
            context.getCompletedTasks(),
            context.getTotalTasks(),
            contributions
        );
    }
}
