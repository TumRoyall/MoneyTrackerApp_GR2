package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateEventTransactionRequest {
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private UUID categoryId;

    @Size(max = 500, message = "Note must be less than 500 characters")
    private String note;

    @NotNull(message = "Date is required")
    private LocalDate date;

    /**
     * Who actually paid for this expense
     * Default: creator (user making the request)
     */
    private UUID payerId;

    /**
     * Whether to transfer money from personal wallet
     */
    private Boolean isTransferFromPersonal;

    /**
     * Source wallet for transfer
     */
    private UUID personalWalletId;
}