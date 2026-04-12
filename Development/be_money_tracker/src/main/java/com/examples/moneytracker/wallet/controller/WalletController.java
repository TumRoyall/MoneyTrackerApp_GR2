package com.examples.moneytracker.wallet.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.wallet.dto.CreateWalletRequest;
import com.examples.moneytracker.wallet.dto.UpdateWalletRequest;
import com.examples.moneytracker.wallet.dto.WalletResponse;
import com.examples.moneytracker.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WalletResponse>>> listWallets(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(walletService.listWallets(user.getId())));
    }

    @GetMapping("/{walletId}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(
            @PathVariable UUID walletId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(walletService.getWallet(walletId, user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(
            @RequestBody @Valid CreateWalletRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(walletService.createWallet(request, user.getId())));
    }

    @PutMapping("/{walletId}")
    public ResponseEntity<ApiResponse<WalletResponse>> updateWallet(
            @PathVariable UUID walletId,
            @RequestBody @Valid UpdateWalletRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(walletService.updateWallet(walletId, request, user.getId())));
    }

    @DeleteMapping("/{walletId}")
    public ResponseEntity<Void> deleteWallet(
            @PathVariable UUID walletId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        walletService.deleteWallet(walletId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
