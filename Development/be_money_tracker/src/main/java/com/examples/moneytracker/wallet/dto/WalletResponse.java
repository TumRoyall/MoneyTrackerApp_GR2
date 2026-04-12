package com.examples.moneytracker.wallet.dto;

import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.model.WalletType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class WalletResponse {
    private UUID walletId;
    private String name;
    private WalletType type;
    private String currency;
    private BigDecimal currentBalance;
    private String description;
    private Instant createdAt;

    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(
                wallet.getWalletId(),
                wallet.getName(),
                wallet.getType(),
                wallet.getCurrency(),
                wallet.getCurrentBalance(),
                wallet.getDescription(),
                wallet.getCreatedAt()
        );
    }
}
