package com.examples.moneytracker.budget.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BudgetPeriodTypeConverter implements AttributeConverter<BudgetPeriodType, String> {

    @Override
    public String convertToDatabaseColumn(BudgetPeriodType attribute) {
        return attribute == null ? null : attribute.toValue();
    }

    @Override
    public BudgetPeriodType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : BudgetPeriodType.fromString(dbData);
    }
}
