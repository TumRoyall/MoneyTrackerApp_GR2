package com.examples.moneytracker.budget.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BudgetSource {
    MANUAL,
    AI_CONFIRMED;

    @JsonCreator
    public static BudgetSource fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return BudgetSource.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown BudgetSource: " + value, ex);
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
