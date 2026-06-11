package com.examples.moneytracker.event.dto;

import com.examples.moneytracker.event.model.EventTransaction;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class EventTransactionResponse {
    private UUID id;
    private UUID eventId;
    private UUID creatorId;
    private String creatorName;
    private String creatorAvatar;
    private UUID payerId;
    private String payerName;
    private BigDecimal amount;
    private UUID categoryId;
    private String categoryName;
    private String categoryIcon;
    private String note;
    private LocalDate date;
    private Boolean isTransferFromPersonal;
    private UUID personalWalletId;
    private Instant createdAt;
    private Long version;
}