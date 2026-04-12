package com.examples.moneytracker.wallet.dto;

import com.examples.moneytracker.wallet.model.WalletType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateWalletRequest {
    @NotBlank
    private String name;

    @NotNull
    private WalletType type;

    @NotBlank
    private String currency;

    private BigDecimal currentBalance;

    private String description;
}
