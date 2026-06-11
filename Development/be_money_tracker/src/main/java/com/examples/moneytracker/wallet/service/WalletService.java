package com.examples.moneytracker.wallet.service;

import com.examples.moneytracker.wallet.dto.CreateWalletRequest;
import com.examples.moneytracker.wallet.dto.UpdateWalletRequest;
import com.examples.moneytracker.wallet.dto.WalletResponse;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletBalanceService walletBalanceService;
    private final com.examples.moneytracker.sync.service.SyncChangeLogService syncChangeLogService;

    @Transactional
    public WalletResponse createWallet(CreateWalletRequest request, UUID userId) {
        if (walletRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new IllegalArgumentException("Wallet name already exists");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setName(request.getName());
        wallet.setType(request.getType());
        wallet.setCurrency(request.getCurrency());
        if (request.getOpeningBalance() != null) {
            wallet.setOpeningBalance(request.getOpeningBalance());
        } else {
            wallet.setOpeningBalance(java.math.BigDecimal.ZERO);
        }
        wallet.setCurrentBalance(wallet.getOpeningBalance());
        wallet.setDescription(request.getDescription());

        walletRepository.save(wallet);
        syncChangeLogService.recordChange(userId, "wallets", wallet.getWalletId(), "UPSERT");
        return WalletResponse.from(wallet);
    }

    public List<WalletResponse> listWallets(UUID userId) {
        return walletRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(WalletResponse::from)
                .toList();
    }

    public WalletResponse getWallet(UUID walletId, UUID userId) {
        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(walletId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
        return WalletResponse.from(wallet);
    }

    @Transactional
    public WalletResponse updateWallet(UUID walletId, UpdateWalletRequest request, UUID userId) {
        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(walletId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(wallet.getName())
                    && walletRepository.existsByUserIdAndName(userId, request.getName())) {
                throw new IllegalArgumentException("Wallet name already exists");
            }
            wallet.setName(request.getName());
        }

        if (request.getType() != null) {
            wallet.setType(request.getType());
        }

        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            wallet.setCurrency(request.getCurrency());
        }

        if (request.getOpeningBalance() != null) {
            wallet.setOpeningBalance(request.getOpeningBalance());
        }

        if (request.getDescription() != null) {
            wallet.setDescription(request.getDescription());
        }

        walletRepository.save(wallet);
        walletBalanceService.rebuildWalletBalance(wallet);
        return WalletResponse.from(wallet);
    }

    @Transactional
    public void deleteWallet(UUID walletId, UUID userId) {
        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(walletId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        wallet.setDeletedAt(Instant.now());
        walletRepository.save(wallet);
        syncChangeLogService.recordChange(userId, "wallets", wallet.getWalletId(), "DELETE");
    }
}
