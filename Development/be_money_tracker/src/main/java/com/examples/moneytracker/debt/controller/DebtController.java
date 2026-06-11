package com.examples.moneytracker.debt.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.debt.dto.CreateDebtRequest;
import com.examples.moneytracker.debt.dto.DebtResponse;
import com.examples.moneytracker.debt.dto.UpdateDebtRequest;
import com.examples.moneytracker.debt.service.DebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @PostMapping
    public ResponseEntity<ApiResponse<DebtResponse>> createDebt(
            @RequestBody @Valid CreateDebtRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(debtService.createDebt(request, user.getId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DebtResponse>>> listDebts(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(debtService.listDebts(user.getId())));
    }

    @GetMapping("/{debtId}")
    public ResponseEntity<ApiResponse<DebtResponse>> getDebt(
            @PathVariable UUID debtId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(debtService.getDebt(debtId, user.getId())));
    }

    @PutMapping("/{debtId}")
    public ResponseEntity<ApiResponse<DebtResponse>> updateDebt(
            @PathVariable UUID debtId,
            @RequestBody @Valid UpdateDebtRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(debtService.updateDebt(debtId, request, user.getId())));
    }

    @DeleteMapping("/{debtId}")
    public ResponseEntity<Void> deleteDebt(
            @PathVariable UUID debtId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        debtService.deleteDebt(debtId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
