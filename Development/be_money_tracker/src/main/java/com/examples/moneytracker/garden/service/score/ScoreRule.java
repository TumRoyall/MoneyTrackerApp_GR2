package com.examples.moneytracker.garden.service.score;

public interface ScoreRule {
    String ruleCode();

    int order();

    ScoreContribution evaluate(ScoreContext context);
}
