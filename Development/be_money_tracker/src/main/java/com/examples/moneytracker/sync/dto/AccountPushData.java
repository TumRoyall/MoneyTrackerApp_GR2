package com.examples.moneytracker.sync.dto;

import com.examples.moneytracker.accounts.model.AccountType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountPushData {
    private String accountName;
    private String type;
    private String currency;
    private BigDecimal currentValue;
    private String description;
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;
    
    public AccountType getAccountType() {
        if (type == null) return AccountType.REGULAR;
        try {
            return AccountType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return AccountType.REGULAR;
        }
    }
}
