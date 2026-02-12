package com.examples.moneytracker.transaction.dto;

import lombok.Data;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionFilterRequest {

    @NonNull
    private Long accountId;
    private Long categoryId;
    private String type; // INCOME / EXPENSE

    private LocalDate fromDate;
    private LocalDate toDate;

    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    private String keyword;
}
