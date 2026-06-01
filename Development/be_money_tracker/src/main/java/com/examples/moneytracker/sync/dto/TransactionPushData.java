package com.examples.moneytracker.sync.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class TransactionPushData {
    private String walletId;
    private String categoryId;
    private BigDecimal amount;
    private String type;
    private String note;
    private String txDate; // LocalDate as string YYYY-MM-DD
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;
}
