package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionFilterRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.dto.UpdateTransactionRequest;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.model.TransactionType;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import com.examples.moneytracker.wallet.service.WalletBalanceService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository txRepo;
    private final CategoryRepository categoryRepo;
        private final WalletRepository walletRepo;
        private final WalletBalanceService walletBalanceService;
        private final com.examples.moneytracker.sync.service.SyncChangeLogService syncChangeLogService;

    public Page<TransactionResponse> getTransactions(
            TransactionFilterRequest filter,
            Pageable pageable,
            UUID userId
    ) {
        walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(filter.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        var spec = TransactionSpecification.filter(
                userId,
                filter.getWalletId(),
                filter.getCategoryId(),
                filter.getType(),
                filter.getFromDate(),
                filter.getToDate(),
                filter.getMinAmount(),
                filter.getMaxAmount(),
                filter.getKeyword()
        );

        return txRepo.findAll(spec, pageable)
                .map(this::map);
    }

    @Transactional
    public TransactionResponse create(CreateTransactionRequest req, UUID userId) {

        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(req.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        // ===== CHECK CATEGORY (DEFAULT OR USER) =====
        Category cat = categoryRepo
                .findAccessibleCategory(
                        req.getCategoryId(),
                        userId
                )
                .orElseThrow(() -> new AccessDeniedException("Not your category"));

        TransactionType type = resolveType(req.getType(), cat.getType(), null);

        // ===== SAVE TRANSACTION =====
        Transaction tx = new Transaction();
        tx.setWalletId(wallet.getWalletId());
        tx.setCreatedBy(userId);
        tx.setCategoryId(req.getCategoryId());
        tx.setAmount(req.getAmount());
        tx.setType(type);
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());

        txRepo.save(tx);
        walletBalanceService.applyTransactionCreate(wallet, tx);
        syncChangeLogService.recordChange(userId, "transactions", tx.getTransactionId(), "UPSERT");
        return map(tx);
    }


    @Transactional
    public TransactionResponse update(UUID transactionId, UpdateTransactionRequest req, UUID userId) {

        Transaction tx = txRepo
                .findByTransactionIdAndCreatedByAndDeletedAtIsNull(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

        Category newCat = categoryRepo
                .findAccessibleCategory(req.getCategoryId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your category"));

        BigDecimal oldAmount = tx.getAmount();
        TransactionType oldType = tx.getType() != null
                ? tx.getType()
                : resolveType(null, newCat.getType(), TransactionType.EXPENSE);

        TransactionType newType = resolveType(req.getType(), newCat.getType(), oldType);

        tx.setCategoryId(req.getCategoryId());
        tx.setAmount(req.getAmount());
        tx.setType(newType);
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : tx.getDate());

        txRepo.save(tx);
        walletBalanceService.applyTransactionUpdate(wallet, oldAmount, oldType, tx.getAmount(), tx.getType());
        syncChangeLogService.recordChange(userId, "transactions", tx.getTransactionId(), "UPSERT");

        return map(tx);
    }



    // DELETE A TRANSACTION
    @Transactional
    public void delete(UUID transactionId, UUID userId) {

        // 1) Lấy transaction của chính user
        Transaction tx = txRepo.findByTransactionIdAndCreatedByAndDeletedAtIsNull(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        // 2) Lấy wallet và check owner (an toàn thêm)
        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

                walletBalanceService.applyTransactionDelete(wallet, tx);
                tx.setDeletedAt(java.time.Instant.now());
                txRepo.save(tx);
                syncChangeLogService.recordChange(userId, "transactions", tx.getTransactionId(), "DELETE");
    }



    private TransactionResponse map(Transaction tx) {
        return new TransactionResponse(
                tx.getTransactionId(),
                tx.getWalletId(),
                tx.getCategoryId(),
                tx.getAmount(),
                tx.getType() != null ? tx.getType().name() : null,
                tx.getNote(),
                tx.getDate(),
                tx.getCreatedAt(),
                tx.getUpdatedAt(),
                tx.getDeletedAt(),
                tx.getVersion()
        );
    }

        public TransactionResponse getTransactionById(UUID transactionId, UUID userId) {
                Transaction tx = txRepo.findByTransactionIdAndCreatedByAndDeletedAtIsNull(transactionId, userId)
                                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

                Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                        .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

                return map(tx);
        }

        private TransactionType resolveType(String requestedType, String categoryType, TransactionType fallback) {
                TransactionType requested = parseType(requestedType);
                if (requested != null) {
                        return requested;
                }

                TransactionType fromCategory = parseType(categoryType);
                if (fromCategory != null) {
                        return fromCategory;
                }

                return fallback != null ? fallback : TransactionType.EXPENSE;
        }

        private TransactionType parseType(String type) {
                if (type == null || type.isBlank()) {
                        return null;
                }
                try {
                        return TransactionType.valueOf(type.trim().toUpperCase());
                } catch (IllegalArgumentException ex) {
                        return null;
                }
        }
}

