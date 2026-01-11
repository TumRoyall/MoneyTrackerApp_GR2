package com.examples.moneytracker.transaction.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Tạo giao dịch thủ công
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @RequestBody @Valid CreateTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                transactionService.create(request, user.getId())
        );
    }
}
