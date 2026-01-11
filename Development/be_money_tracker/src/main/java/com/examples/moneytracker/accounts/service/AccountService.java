package com.examples.moneytracker.accounts.service;

import com.examples.moneytracker.accounts.dto.AccountResponse;
import com.examples.moneytracker.accounts.dto.CreateAccountRequest;
import com.examples.moneytracker.accounts.model.Account;
import com.examples.moneytracker.accounts.repository.AccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    @Transactional
    public AccountResponse createDefaultAccount(
            CreateAccountRequest req,
            Long userId
    ) {
        Account account = new Account();
        account.setUserId(userId);
        account.setAccountName(req.getAccountName());
        account.setType("REGULAR");
        account.setCurrency(req.getCurrency());
        account.setCurrentValue(req.getCurrent_value());
        account.setDescription(req.getDescription());

        accountRepository.save(account);

        return AccountResponse.from(account);
    }
}
