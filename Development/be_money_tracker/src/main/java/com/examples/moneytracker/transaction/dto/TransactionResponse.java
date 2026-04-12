package com.examples.moneytracker.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class TransactionResponse {
    private UUID transactionId;
    private UUID walletId;
    private UUID categoryId;
    private BigDecimal amount;
    private String note;
    private LocalDate date;
    private Instant createdAt;
    private Instant updatedAt;
}
