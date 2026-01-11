package com.examples.moneytracker.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class TransactionResponse {
    private Long transactionId;
    private Long accountId;
    private Long categoryId;
    private BigDecimal amount;
    private String note;
    private LocalDate date;
    private Instant createdAt;
}
