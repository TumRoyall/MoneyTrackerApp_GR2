package com.examples.moneytracker.transaction.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionFilterRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.dto.UpdateTransactionRequest;
import com.examples.moneytracker.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // GET PAGE TRANSACTIONS OF A USER
    @GetMapping
    public Page<TransactionResponse> getTransactions(
            @Valid @ModelAttribute TransactionFilterRequest filter,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return transactionService.getTransactions(filter, pageable, user.getId());
    }

    // CREATE A TRANSACTION
    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @RequestBody @Valid CreateTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                transactionService.create(request, user.getId())
        );
    }

    // UPDATE A TRANSACTION
    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @RequestBody @Valid UpdateTransactionRequest req,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                transactionService.update(id, req, user.getId())
        );
    }

    // DELETE A TRANSACTION
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        transactionService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
