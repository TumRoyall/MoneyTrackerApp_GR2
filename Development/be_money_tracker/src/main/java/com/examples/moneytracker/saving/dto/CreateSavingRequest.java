package com.examples.moneytracker.saving.dto;

import com.examples.moneytracker.saving.model.SavingPeriodUnit;
import com.examples.moneytracker.saving.model.SavingType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class CreateSavingRequest {
    @NotNull
    private String title;

    @NotNull
    private BigDecimal targetAmount;

    @NotNull
    private String currency;

    @NotNull
    private SavingType type;

    private SavingPeriodUnit periodUnit;

    private LocalDate startPeriod;
}
