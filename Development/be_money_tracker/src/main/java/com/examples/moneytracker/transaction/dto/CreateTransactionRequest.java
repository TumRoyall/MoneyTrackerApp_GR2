package com.examples.moneytracker.transaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateTransactionRequest {
    @NotNull
    private Long accountId;
    @NotNull private Long categoryId;
    @NotNull @Positive
    private BigDecimal amount;
    private String note;
    @NotNull private LocalDate date;
}
