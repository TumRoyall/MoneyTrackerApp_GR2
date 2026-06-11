package com.examples.moneytracker.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class EventResponse {
    private UUID eventId;
    private String name;
    private String icon;
    private String description;
    private String shareCode;
    private String shareLink;
    private String status;
    private Instant startDate;
    private Instant endDate;
    private UUID createdBy;
    private Instant createdAt;
    private Integer memberCount;
    private BigDecimal totalSpent;
    private Integer transactionCount;
}