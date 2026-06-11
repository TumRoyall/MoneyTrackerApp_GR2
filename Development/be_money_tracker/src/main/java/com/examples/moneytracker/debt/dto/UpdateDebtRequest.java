package com.examples.moneytracker.debt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class UpdateDebtRequest {
    private String title;
    private BigDecimal targetAmount;
    private LocalDate startDate;
    private LocalDate targetDate;
}
