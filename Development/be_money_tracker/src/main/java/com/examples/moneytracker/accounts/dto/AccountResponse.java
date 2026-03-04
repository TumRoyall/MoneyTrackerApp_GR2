package com.examples.moneytracker.accounts.dto;

import com.examples.moneytracker.accounts.model.Account;
import com.examples.moneytracker.accounts.model.AccountType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AccountResponse {

    private UUID accountId;
    private String accountName;
    private AccountType type;
    private String currency;
    private BigDecimal currentValue;
    private Instant createdAt;

    public static AccountResponse from(Account acc) {
        return new AccountResponse(
                acc.getAccountId(),
                acc.getAccountName(),
                acc.getType(),
                acc.getCurrency(),
                acc.getCurrentValue(),
                acc.getCreatedAt()
        );
    }
}
