package com.examples.moneytracker.saving.dto;

import com.examples.moneytracker.saving.model.SavingPeriodUnit;
import com.examples.moneytracker.saving.model.SavingType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class UpdateSavingRequest {
    private String title;
    private BigDecimal targetAmount;
    private SavingType type;
    private SavingPeriodUnit periodUnit;
    private LocalDate startPeriod;
}
