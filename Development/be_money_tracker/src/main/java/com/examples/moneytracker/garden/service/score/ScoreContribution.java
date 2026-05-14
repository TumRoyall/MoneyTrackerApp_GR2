package com.examples.moneytracker.garden.service.score;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ScoreContribution {
    private String ruleCode;
    private int delta;
    private String detail;
}
