package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class CreateGuestTransactionRequest {
    @NotBlank(message = "Creator name is required")
    private String creatorName;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String categoryId;

    private String categoryName;

    private String categoryIcon;

    private String note;

    private Instant date;
}
