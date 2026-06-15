package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateEventTransactionRequest {
    @Positive
    private BigDecimal amount;
    private UUID categoryId;
    private String note;
    private LocalDate date;
}
