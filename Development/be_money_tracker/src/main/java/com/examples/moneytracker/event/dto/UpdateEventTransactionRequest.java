package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateEventTransactionRequest {
    @Size(max = 500, message = "Note must be less than 500 characters")
    private String note;

    private BigDecimal amount;

    private UUID categoryId;
}