package com.examples.moneytracker.transaction.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TransactionFilterRequest {

    @NotNull
    private UUID walletId;
    private UUID categoryId;
    private String type; // INCOME / EXPENSE

    private LocalDate fromDate;
    private LocalDate toDate;

    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    private String keyword;
}
