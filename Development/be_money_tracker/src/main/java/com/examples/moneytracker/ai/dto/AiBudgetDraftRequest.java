package com.examples.moneytracker.ai.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class AiBudgetDraftRequest {
    @NotNull
    @Positive
    private BigDecimal income;

    private String userPrompt;

    // null = applies to all wallets
    private UUID walletId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;
}
