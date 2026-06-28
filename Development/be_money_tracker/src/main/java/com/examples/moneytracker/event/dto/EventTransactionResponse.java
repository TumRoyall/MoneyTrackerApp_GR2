package com.examples.moneytracker.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventTransactionResponse {
    private UUID id;
    private UUID eventId;
    private UUID creatorId;
    private String creatorName;
    private String creatorAvatar;
    private UUID walletId;
    private BigDecimal amount;
    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;
    private String note;
    private LocalDate date;
    private Instant createdAt;
    private Long version;
}
