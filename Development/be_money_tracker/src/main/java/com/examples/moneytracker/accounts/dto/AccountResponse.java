package com.examples.moneytracker.accounts.dto;

import com.examples.moneytracker.accounts.model.Account;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
public class AccountResponse {

    private Long accountId;
    private String accountName;
    private String type;
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
