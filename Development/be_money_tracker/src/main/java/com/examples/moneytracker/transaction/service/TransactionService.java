package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionFilterRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.dto.UpdateTransactionRequest;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
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

    public Page<TransactionResponse> getTransactions(
            TransactionFilterRequest filter,
            Pageable pageable,
            UUID userId
    ) {
        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(filter.getWalletId(), userId)
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

        // ===== DETERMINE SIGN =====
        BigDecimal signed;
        switch (cat.getType()) {
            case "INCOME" -> signed = req.getAmount();
            case "EXPENSE" -> signed = req.getAmount().negate();
            default -> throw new IllegalStateException("Invalid category type");
        }

        // ===== UPDATE WALLET BALANCE =====
        wallet.setCurrentBalance(wallet.getCurrentBalance().add(signed));
        walletRepo.save(wallet);

        // ===== SAVE TRANSACTION =====
        Transaction tx = new Transaction();
        tx.setWalletId(wallet.getWalletId());
        tx.setCreatedBy(userId);
        tx.setCategory(cat);
        tx.setAmount(req.getAmount());
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());

        txRepo.save(tx);
        return map(tx);
    }


    @Transactional
    public TransactionResponse update(UUID transactionId, UpdateTransactionRequest req, UUID userId) {

        Transaction tx = txRepo
                .findByTransactionIdAndCreatedBy(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

        Category newCat = categoryRepo
                .findAccessibleCategory(req.getCategoryId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your category"));

        // rollback old
        BigDecimal oldSigned =
                "EXPENSE".equals(tx.getCategory().getType())
                        ? tx.getAmount().negate()
                        : tx.getAmount();
        wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(oldSigned));

        // apply new
        BigDecimal newSigned =
                "EXPENSE".equals(newCat.getType())
                        ? req.getAmount().negate()
                        : req.getAmount();
        wallet.setCurrentBalance(wallet.getCurrentBalance().add(newSigned));

        walletRepo.save(wallet);

        tx.setCategory(newCat);
        tx.setAmount(req.getAmount());
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : tx.getDate());

        txRepo.save(tx);

        return map(tx);
    }



    // DELETE A TRANSACTION
    @Transactional
    public void delete(UUID transactionId, UUID userId) {

        // 1) Lấy transaction của chính user
        Transaction tx = txRepo.findByTransactionIdAndCreatedBy(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        // 2) Lấy wallet và check owner (an toàn thêm)
        Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

        // 3) Lấy category để biết INCOME/EXPENSE
        Category cat = tx.getCategory();

        // ROLL BACK
        // 4) Tính signed của transaction cũ
        BigDecimal signed;
        switch (cat.getType()) {
            case "INCOME" -> signed = tx.getAmount();
            case "EXPENSE" -> signed = tx.getAmount().negate();
            default -> throw new IllegalStateException("Invalid category type");
        }

        // 5) Rollback số dư: balance = balance - signed
        wallet.setCurrentBalance(wallet.getCurrentBalance().subtract(signed));
        walletRepo.save(wallet);

        // 6) Xóa transaction
        txRepo.delete(tx);
    }



    private TransactionResponse map(Transaction tx) {
        return new TransactionResponse(
                tx.getTransactionId(),
                                tx.getWalletId(),
                tx.getCategory().getCategoryId(),
                tx.getAmount(),
                tx.getNote(),
                tx.getDate(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }

        public TransactionResponse getTransactionById(UUID transactionId, UUID userId) {
                Transaction tx = txRepo.findByTransactionIdAndCreatedBy(transactionId, userId)
                                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

                Wallet wallet = walletRepo.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                        .orElseThrow(() -> new AccessDeniedException("Not your wallet"));

                return map(tx);
        }
}

