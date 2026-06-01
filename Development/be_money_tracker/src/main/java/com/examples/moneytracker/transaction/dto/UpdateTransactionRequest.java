package com.examples.moneytracker.transaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateTransactionRequest {

    @NotNull
    private UUID categoryId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @Pattern(regexp = "INCOME|EXPENSE", message = "type must be INCOME or EXPENSE")
    private String type;

    private String note;

    @NotNull
    private LocalDate date;
}
