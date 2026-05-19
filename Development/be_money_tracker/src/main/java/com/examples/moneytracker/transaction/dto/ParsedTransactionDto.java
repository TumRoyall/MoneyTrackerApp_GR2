package com.examples.moneytracker.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ParsedTransactionDto {
    private BigDecimal amount;
    private UUID walletId;
    private UUID categoryId;
    private String note;
    private LocalDate date;
}
