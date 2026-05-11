package com.examples.moneytracker.saving.dto;

import com.examples.moneytracker.saving.model.SavingGoal;
import com.examples.moneytracker.saving.model.SavingPeriodUnit;
import com.examples.moneytracker.saving.model.SavingType;
import com.examples.moneytracker.wallet.model.Wallet;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class SavingResponse {
    private UUID savingId;
    private UUID walletId;
    private String walletName;
    private String currency;
    private BigDecimal currentBalance;
    private String title;
    private BigDecimal targetAmount;
    private SavingType type;
    private SavingPeriodUnit periodUnit;
    private LocalDate startPeriod;
    private Instant createdAt;
    private Instant updatedAt;

    public static SavingResponse from(SavingGoal saving, Wallet wallet) {
        return new SavingResponse(
                saving.getSavingId(),
                saving.getWalletId(),
                wallet != null ? wallet.getName() : null,
                wallet != null ? wallet.getCurrency() : null,
                wallet != null ? wallet.getCurrentBalance() : null,
                saving.getTitle(),
                saving.getTargetAmount(),
                saving.getType(),
                saving.getPeriodUnit(),
                saving.getStartPeriod(),
                saving.getCreatedAt(),
                saving.getUpdatedAt()
        );
    }
}
