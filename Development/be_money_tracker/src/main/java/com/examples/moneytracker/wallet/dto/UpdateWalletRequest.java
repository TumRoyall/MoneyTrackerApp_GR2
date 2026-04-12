package com.examples.moneytracker.wallet.dto;

import com.examples.moneytracker.wallet.model.WalletType;
import lombok.Data;

@Data
public class UpdateWalletRequest {
    private String name;
    private WalletType type;
    private String currency;
    private String description;
}
