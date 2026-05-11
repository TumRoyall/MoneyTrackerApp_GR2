package com.examples.moneytracker.saving.service;

import com.examples.moneytracker.saving.dto.CreateSavingRequest;
import com.examples.moneytracker.saving.dto.SavingResponse;
import com.examples.moneytracker.saving.dto.UpdateSavingRequest;
import com.examples.moneytracker.saving.model.SavingGoal;
import com.examples.moneytracker.saving.model.SavingPeriodUnit;
import com.examples.moneytracker.saving.model.SavingType;
import com.examples.moneytracker.saving.repository.SavingRepository;
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
public class SavingService {

    private final SavingRepository savingRepository;
    private final WalletRepository walletRepository;

    @Transactional
    public SavingResponse createSaving(CreateSavingRequest request, UUID userId) {
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
        if (request.getType() == null) {
            throw new IllegalArgumentException("Saving type is required");
        }

        if (walletRepository.existsByUserIdAndName(userId, title)) {
            throw new IllegalArgumentException("Wallet name already exists");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setName(title);
        wallet.setType(WalletType.SAVING);
        wallet.setCurrency(request.getCurrency());
        wallet.setCurrentBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        SavingGoal saving = new SavingGoal();
        saving.setUserId(userId);
        saving.setWalletId(wallet.getWalletId());
        saving.setTitle(title);
        saving.setTargetAmount(request.getTargetAmount());
        saving.setType(request.getType());
        applyPeriodSettings(saving, request.getType(), request.getPeriodUnit(), request.getStartPeriod());

        savingRepository.save(saving);
        return SavingResponse.from(saving, wallet);
    }

    public List<SavingResponse> listSavings(UUID userId) {
        List<SavingGoal> savings = savingRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<UUID> walletIds = savings.stream().map(SavingGoal::getWalletId).toList();
        Map<UUID, Wallet> walletMap = walletRepository
                .findByUserIdAndWalletIdInAndDeletedAtIsNull(userId, walletIds)
                .stream()
                .collect(Collectors.toMap(Wallet::getWalletId, wallet -> wallet));

        return savings.stream()
                .map(item -> SavingResponse.from(item, walletMap.get(item.getWalletId())))
                .toList();
    }

    public SavingResponse getSaving(UUID savingId, UUID userId) {
        SavingGoal saving = savingRepository.findBySavingIdAndUserIdAndDeletedAtIsNull(savingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saving not found"));

        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(saving.getWalletId(), userId)
                .orElse(null);

        return SavingResponse.from(saving, wallet);
    }

    @Transactional
    public SavingResponse updateSaving(UUID savingId, UpdateSavingRequest request, UUID userId) {
        SavingGoal saving = savingRepository.findBySavingIdAndUserIdAndDeletedAtIsNull(savingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saving not found"));

        Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(saving.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (request.getTitle() != null && !request.getTitle().trim().isBlank()) {
            String newTitle = request.getTitle().trim();
            if (!newTitle.equals(saving.getTitle()) && walletRepository.existsByUserIdAndName(userId, newTitle)) {
                throw new IllegalArgumentException("Wallet name already exists");
            }
            saving.setTitle(newTitle);
            wallet.setName(newTitle);
        }

        if (request.getTargetAmount() != null) {
            if (request.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Target amount must be greater than 0");
            }
            saving.setTargetAmount(request.getTargetAmount());
        }

        if (request.getType() != null || request.getPeriodUnit() != null || request.getStartPeriod() != null) {
            SavingType nextType = request.getType() != null ? request.getType() : saving.getType();
            SavingPeriodUnit nextUnit = request.getPeriodUnit() != null ? request.getPeriodUnit() : saving.getPeriodUnit();
            LocalDate nextStart = request.getStartPeriod() != null ? request.getStartPeriod() : saving.getStartPeriod();
            applyPeriodSettings(saving, nextType, nextUnit, nextStart);
            saving.setType(nextType);
        }

        walletRepository.save(wallet);
        savingRepository.save(saving);
        return SavingResponse.from(saving, wallet);
    }

    @Transactional
    public void deleteSaving(UUID savingId, UUID userId) {
        SavingGoal saving = savingRepository.findBySavingIdAndUserIdAndDeletedAtIsNull(savingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saving not found"));

        saving.setDeletedAt(Instant.now());
        savingRepository.save(saving);

        walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(saving.getWalletId(), userId)
                .ifPresent(wallet -> {
                    wallet.setDeletedAt(Instant.now());
                    walletRepository.save(wallet);
                });
    }

    private void applyPeriodSettings(
            SavingGoal saving,
            SavingType type,
            SavingPeriodUnit periodUnit,
            LocalDate startPeriod
    ) {
        if (type == SavingType.PERIODIC) {
            if (periodUnit == null) {
                throw new IllegalArgumentException("Period unit is required for periodic saving");
            }
            saving.setPeriodUnit(periodUnit);
            saving.setStartPeriod(resolveStartPeriod(periodUnit, startPeriod));
        } else {
            saving.setPeriodUnit(null);
            saving.setStartPeriod(null);
        }
    }

    private LocalDate resolveStartPeriod(SavingPeriodUnit unit, LocalDate startPeriod) {
        if (startPeriod != null) {
            return startPeriod;
        }
        LocalDate today = LocalDate.now();
        if (unit == SavingPeriodUnit.YEARLY) {
            return LocalDate.of(today.getYear(), 1, 1);
        }
        return LocalDate.of(today.getYear(), today.getMonth(), 1);
    }
}
