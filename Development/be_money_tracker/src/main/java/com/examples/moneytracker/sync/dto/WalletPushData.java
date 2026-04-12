package com.examples.moneytracker.sync.dto;

import com.examples.moneytracker.wallet.model.WalletType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletPushData {
    private String name;
    private String type;
    private String currency;
    private BigDecimal currentBalance;
    private String description;
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;

    public WalletType getWalletType() {
        if (type == null) return WalletType.REGULAR;
        try {
            return WalletType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return WalletType.REGULAR;
        }
    }
}
