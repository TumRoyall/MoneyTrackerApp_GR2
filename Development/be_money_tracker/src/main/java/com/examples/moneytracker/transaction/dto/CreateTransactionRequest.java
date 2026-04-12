package com.examples.moneytracker.transaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateTransactionRequest {
    @NotNull
    private UUID walletId;
    @NotNull private UUID categoryId;
    @NotNull @Positive
    private BigDecimal amount;
    private String note;
    @NotNull private LocalDate date;
}
