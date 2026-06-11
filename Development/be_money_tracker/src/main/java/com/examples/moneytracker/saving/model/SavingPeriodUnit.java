package com.examples.moneytracker.saving.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SavingPeriodUnit {
    MONTHLY,
    YEARLY;

    @JsonCreator
    public static SavingPeriodUnit fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return SavingPeriodUnit.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown SavingPeriodUnit: " + value, ex);
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
