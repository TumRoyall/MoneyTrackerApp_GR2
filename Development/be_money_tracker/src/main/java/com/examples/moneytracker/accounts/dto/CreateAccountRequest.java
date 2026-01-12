package com.examples.moneytracker.accounts.dto;

import com.examples.moneytracker.accounts.model.AccountType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateAccountRequest {
    @NotBlank
    private String accountName;
    private BigDecimal current_value;
    private String currency;
    private String description;

    private AccountType type;
}
