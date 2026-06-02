package com.examples.moneytracker.event.dto;

import com.examples.moneytracker.event.model.EventMember;
import com.examples.moneytracker.event.model.EventMemberRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class EventMemberResponse {
    private UUID id;
    private UUID eventId;
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String role;
    private Instant joinedAt;
    private BigDecimal contribution;
    private Integer transactionCount;
    private BigDecimal balance;

    /**
     * Balance explanation:
     * - positive: user paid more than fair share, should receive money
     * - negative: user paid less than fair share, owes money
     * - zero: user paid exactly fair share
     */
    public String getBalanceStatus() {
        if (balance == null) return "UNKNOWN";
        int cmp = balance.compareTo(BigDecimal.ZERO);
        if (cmp > 0) return "CREDITOR";  // should receive
        if (cmp < 0) return "DEBTOR";     // owes money
        return "EVEN";
    }
}