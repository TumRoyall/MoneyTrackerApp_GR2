package com.examples.moneytracker.debt.service;

import com.examples.moneytracker.debt.dto.CreateDebtRequest;
import com.examples.moneytracker.debt.dto.DebtResponse;
import com.examples.moneytracker.debt.dto.UpdateDebtRequest;
import com.examples.moneytracker.debt.model.DebtGoal;
import com.examples.moneytracker.debt.repository.DebtRepository;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.model.WalletType;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DebtService {

    private final DebtRepository debtRepository;
    private final WalletRepository walletRepository;

    @Transactional
    public DebtResponse createDebt(CreateDebtRequest request, UUID userId) {
        String title = request.getTitle() != null ? request.getTitle().trim() : "";
        if (title.isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getTargetAmount() == null || request.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Target amount must be greater than 0");
        }
        if (request.getCurrency() == null || request.getCurrency().isBlank()) {
            throw new IllegalArgumentException("Currency is required");
        }

        if (walletRepository.existsByUserIdAndName(userId, title)) {
            throw new IllegalArgumentException("Wallet name already exists");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setName(title);
        wallet.setType(WalletType.DEBT);
        wallet.setCurrency(request.getCurrency());
        wallet.setCurrentBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        DebtGoal debt = new DebtGoal();
        debt.setUserId(userId);
        debt.setWalletId(wallet.getWalletId());
        debt.setTitle(title);
        debt.setTargetAmount(request.getTargetAmount());
        debt.setStartDate(resolveStartDate(request.getStartDate()));
        debt.setTargetDate(request.getTargetDate());

        debtRepository.save(debt);
        return DebtResponse.from(debt, wallet);
    }

    public List<DebtResponse> listDebts(UUID userId) {
        List<DebtGoal> debts = debtRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<UUID> walletIds = debts.stream().map(DebtGoal::getWalletId).toList();
        Map<UUID, Wallet> walletMap = walletRepository
                .findByUserIdAndWalletIdInAndDeletedAtIsNull(userId, walletIds)
                .stream()
                .collect(Collectors.toMap(Wallet::getWalletId, wallet -> wallet));

        return debts.stream()
                .map(item -> DebtResponse.from(item, walletMap.get(item.getWalletId())))
                .toList();
    }

    public DebtResponse getDebt(UUID debtId, UUID userId) {
        DebtGoal debt = debtRepository.findByDebtIdAndUserIdAndDeletedAtIsNull(debtId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Debt not found"));

        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(debt.getWalletId(), userId)
                .orElse(null);

        return DebtResponse.from(debt, wallet);
    }

    @Transactional
    public DebtResponse updateDebt(UUID debtId, UpdateDebtRequest request, UUID userId) {
        DebtGoal debt = debtRepository.findByDebtIdAndUserIdAndDeletedAtIsNull(debtId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Debt not found"));

        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(debt.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (request.getTitle() != null && !request.getTitle().trim().isBlank()) {
            String newTitle = request.getTitle().trim();
            if (!newTitle.equals(debt.getTitle()) && walletRepository.existsByUserIdAndName(userId, newTitle)) {
                throw new IllegalArgumentException("Wallet name already exists");
            }
            debt.setTitle(newTitle);
            wallet.setName(newTitle);
        }

        if (request.getTargetAmount() != null) {
            if (request.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Target amount must be greater than 0");
            }
            debt.setTargetAmount(request.getTargetAmount());
        }

        if (request.getStartDate() != null) {
            debt.setStartDate(request.getStartDate());
        }

        if (request.getTargetDate() != null) {
            debt.setTargetDate(request.getTargetDate());
        }

        walletRepository.save(wallet);
        debtRepository.save(debt);
        return DebtResponse.from(debt, wallet);
    }

    @Transactional
    public void deleteDebt(UUID debtId, UUID userId) {
        DebtGoal debt = debtRepository.findByDebtIdAndUserIdAndDeletedAtIsNull(debtId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Debt not found"));

        debt.setDeletedAt(Instant.now());
        debtRepository.save(debt);

        walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(debt.getWalletId(), userId)
                .ifPresent(wallet -> {
                    wallet.setDeletedAt(Instant.now());
                    walletRepository.save(wallet);
                });
    }

    private LocalDate resolveStartDate(LocalDate startDate) {
        return startDate != null ? startDate : LocalDate.now();
    }
}
