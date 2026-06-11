package com.examples.moneytracker.event.dto;

import com.examples.moneytracker.event.model.Event;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class EventDetailResponse {
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
    private Instant updatedAt;
    private Long version;
    private Integer memberCount;
    private BigDecimal totalSpent;
    private Integer transactionCount;
    private BigDecimal perPersonShare;

    public static EventDetailResponse from(Event event, int memberCount, BigDecimal totalSpent, int transactionCount) {
        BigDecimal perPersonShare = memberCount > 0
            ? totalSpent.divide(BigDecimal.valueOf(memberCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        return new EventDetailResponse(
            event.getEventId(),
            event.getName(),
            event.getIcon(),
            event.getDescription(),
            event.getShareCode(),
            event.getShareLink(),
            event.getStatus().name(),
            event.getStartDate(),
            event.getEndDate(),
            event.getCreatedBy(),
            event.getCreatedAt(),
            event.getUpdatedAt(),
            event.getVersion(),
            memberCount,
            totalSpent,
            transactionCount,
            perPersonShare
        );
    }
}