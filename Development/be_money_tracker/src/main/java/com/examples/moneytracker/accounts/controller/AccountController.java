package com.examples.moneytracker.accounts.controller;

import com.examples.moneytracker.accounts.dto.AccountResponse;
import com.examples.moneytracker.accounts.dto.CreateAccountRequest;
import com.examples.moneytracker.accounts.service.AccountService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @RequestBody @Valid CreateAccountRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                accountService.createDefaultAccount(request, user.getId())
        );
    }

    // GET accounts của user → trả DTO
    @GetMapping
    public List<AccountResponse> getAccounts(@AuthenticationPrincipal CustomUserDetails user) {
        return accountService.getAccountsByUser(user.getId());
    }

    // SOFT DELETE
    @DeleteMapping("/{accountId}")
    public void deleteAccount(
            @PathVariable UUID accountId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        accountService.softDeleteAccount(accountId, user.getId());
    }
}