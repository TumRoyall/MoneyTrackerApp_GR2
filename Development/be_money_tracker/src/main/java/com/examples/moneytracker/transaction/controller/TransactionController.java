package com.examples.moneytracker.transaction.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.common.dto.PageMeta;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionFilterRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.dto.UpdateTransactionRequest;
import com.examples.moneytracker.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // GET PAGE TRANSACTIONS OF A USER
    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(
            @Valid @ModelAttribute TransactionFilterRequest filter,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        var page = transactionService.getTransactions(filter, pageable, user.getId());
        PageMeta meta = new PageMeta(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
        return ResponseEntity.ok(ApiResponse.of(page.getContent(), meta));
    }

    // GET TRANSACTION DETAIL
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                ApiResponse.of(transactionService.getTransactionById(id, user.getId()))
        );
    }

    // CREATE A TRANSACTION
    @PostMapping
        public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @RequestBody @Valid CreateTransactionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
                return ResponseEntity.ok(ApiResponse.of(transactionService.create(request, user.getId())));
    }

    // UPDATE A TRANSACTION
    @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTransactionRequest req,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
                return ResponseEntity.ok(ApiResponse.of(transactionService.update(id, req, user.getId())));
    }

    // DELETE A TRANSACTION
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        transactionService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
