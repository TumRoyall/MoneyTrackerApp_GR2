package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.accounts.model.Account;
import com.examples.moneytracker.accounts.repository.AccountRepository;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionFilterRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.dto.UpdateTransactionRequest;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository txRepo;
    private final CategoryRepository categoryRepo;
    private final AccountRepository accountRepo;

    public Page<TransactionResponse> getTransactions(
            TransactionFilterRequest filter,
            Pageable pageable,
            Long userId
    ) {
        //check owner account
        Account acc = accountRepo.findById(filter.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!userId.equals(acc.getUserId())) {
            throw new AccessDeniedException("Not your account");
        }

        var spec = TransactionSpecification.filter(
                userId,
                filter.getAccountId(),
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
    public TransactionResponse create(CreateTransactionRequest req, Long userId) {

        // ===== CHECK ACCOUNT =====
        Account acc = accountRepo.findById(req.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!userId.equals(acc.getUserId())) {
            throw new AccessDeniedException("Not your account");
        }

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

        // ===== UPDATE ACCOUNT BALANCE =====
        acc.setCurrentValue(acc.getCurrentValue().add(signed));
        accountRepo.save(acc);

        // ===== SAVE TRANSACTION =====
        Transaction tx = new Transaction();
        tx.setAccountId(acc.getAccountId());
        tx.setCreatedBy(userId);
        tx.setCategory(cat);
        tx.setAmount(req.getAmount());
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());

        txRepo.save(tx);
        return map(tx);
    }


    @Transactional
    public TransactionResponse update(Long transactionId, UpdateTransactionRequest req, Long userId) {

        Transaction tx = txRepo
                .findByTransactionIdAndCreatedBy(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        Account acc = accountRepo.findById(tx.getAccountId())
                .orElseThrow(() -> new IllegalStateException("Account not found"));

        if (!userId.equals(acc.getUserId())) {
            throw new AccessDeniedException("Not your account");
        }

        Category newCat = categoryRepo
                .findAccessibleCategory(req.getCategoryId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not your category"));

        // rollback old
        BigDecimal oldSigned =
                "EXPENSE".equals(tx.getCategory().getType())
                        ? tx.getAmount().negate()
                        : tx.getAmount();
        acc.setCurrentValue(acc.getCurrentValue().subtract(oldSigned));

        // apply new
        BigDecimal newSigned =
                "EXPENSE".equals(newCat.getType())
                        ? req.getAmount().negate()
                        : req.getAmount();
        acc.setCurrentValue(acc.getCurrentValue().add(newSigned));

        accountRepo.save(acc);

        tx.setCategory(newCat);
        tx.setAmount(req.getAmount());
        tx.setNote(req.getNote());
        tx.setDate(req.getDate() != null ? req.getDate() : tx.getDate());

        txRepo.save(tx);

        return map(tx);
    }



    // DELETE A TRANSACTION
    @Transactional
    public void delete(Long transactionId, Long userId) {

        // 1) Lấy transaction của chính user
        Transaction tx = txRepo.findByTransactionIdAndCreatedBy(transactionId, userId)
                .orElseThrow(() -> new AccessDeniedException("Transaction not found"));

        // 2) Lấy account và check owner (an toàn thêm)
        Account acc = accountRepo.findById(tx.getAccountId())
                .orElseThrow(() -> new IllegalStateException("Account not found"));

        if (!userId.equals(acc.getUserId())) { // Kiểm tra account này có phải của user này hay ko
            throw new AccessDeniedException("Not your account");
        }

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
        acc.setCurrentValue(acc.getCurrentValue().subtract(signed));
        accountRepo.save(acc);

        // 6) Xóa transaction
        txRepo.delete(tx);
    }



    private TransactionResponse map(Transaction tx) {
        return new TransactionResponse(
                tx.getTransactionId(),
                tx.getAccountId(),
                tx.getCategory().getCategoryId(),
                tx.getAmount(),
                tx.getNote(),
                tx.getDate(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}

