package com.examples.moneytracker.debt.dto;

import com.examples.moneytracker.debt.model.DebtGoal;
import com.examples.moneytracker.wallet.model.Wallet;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
public class DebtResponse {
    private UUID debtId;
    private UUID walletId;
    private String walletName;
    private String currency;
    private BigDecimal currentBalance;
    private String title;
    private BigDecimal targetAmount;
    private LocalDate startDate;
    private LocalDate targetDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static DebtResponse from(DebtGoal debt, Wallet wallet) {
        return new DebtResponse(
                debt.getDebtId(),
                debt.getWalletId(),
                wallet != null ? wallet.getName() : null,
                wallet != null ? wallet.getCurrency() : null,
                wallet != null ? wallet.getCurrentBalance() : null,
                debt.getTitle(),
                debt.getTargetAmount(),
                debt.getStartDate(),
                debt.getTargetDate(),
                debt.getCreatedAt(),
                debt.getUpdatedAt()
        );
    }
}
