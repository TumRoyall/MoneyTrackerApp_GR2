package com.examples.moneytracker.sync.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionPushData {
    private String walletId;
    private String categoryId;
    private BigDecimal amount;
    private String note;
    private String txDate; // LocalDate as string YYYY-MM-DD
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;
}
