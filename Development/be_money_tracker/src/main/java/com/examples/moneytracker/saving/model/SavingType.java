package com.examples.moneytracker.saving.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SavingType {
    ONE_TIME,
    PERIODIC;

    @JsonCreator
    public static SavingType fromString(String value) {
        if (value == null) {
            return null;
        }
        try {
            return SavingType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown SavingType: " + value, ex);
        }
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
