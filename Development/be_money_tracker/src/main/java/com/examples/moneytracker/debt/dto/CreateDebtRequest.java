package com.examples.moneytracker.debt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class CreateDebtRequest {
    @NotNull
    private String title;

    @NotNull
    private BigDecimal targetAmount;

    @NotNull
    private String currency;

    private LocalDate startDate;

    private LocalDate targetDate;
}
