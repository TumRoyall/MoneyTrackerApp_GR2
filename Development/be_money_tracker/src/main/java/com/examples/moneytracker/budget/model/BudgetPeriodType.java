package com.examples.moneytracker.budget.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BudgetPeriodType {
    CUSTOM,
    MONTHLY,
    WEEKLY,
    BIWEEKLY,
    YEARLY;

    @JsonCreator
    public static BudgetPeriodType fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return BudgetPeriodType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown BudgetPeriodType: " + value, ex);
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
