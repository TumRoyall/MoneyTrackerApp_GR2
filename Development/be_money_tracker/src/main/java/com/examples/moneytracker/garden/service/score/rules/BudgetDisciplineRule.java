package com.examples.moneytracker.garden.service.score.rules;

import com.examples.moneytracker.garden.service.score.ScoreContext;
import com.examples.moneytracker.garden.service.score.ScoreContribution;
import com.examples.moneytracker.garden.service.score.ScoreRule;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class BudgetDisciplineRule implements ScoreRule {

    @Override
    public String ruleCode() {
        return "BUDGET_DISCIPLINE";
    }

    @Override
    public int order() {
        return 10;
    }

    @Override
    public ScoreContribution evaluate(ScoreContext context) {
        if (context.getBudgetUsages().isEmpty()) {
            return new ScoreContribution(ruleCode(), 0, "no budgets");
        }

        int delta = 0;
        for (ScoreContext.BudgetUsage usage : context.getBudgetUsages()) {
            if (usage.getLimit().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal ratio = usage.getSpent()
                .divide(usage.getLimit(), 4, RoundingMode.HALF_UP);

            if (ratio.compareTo(BigDecimal.ONE) <= 0) {
                int bonus = Math.round((float) (8 * (1.0 - ratio.doubleValue())));
                delta += Math.max(1, bonus);
            } else {
                double over = Math.min(1.5, ratio.doubleValue() - 1.0);
                int penalty = Math.round((float) (10 * over));
                delta -= Math.max(1, penalty);
            }
        }

        if (delta > 15) {
            delta = 15;
        } else if (delta < -15) {
            delta = -15;
        }

        return new ScoreContribution(ruleCode(), delta, "budget adherence");
    }
}
