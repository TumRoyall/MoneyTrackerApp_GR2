package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.accounts.model.Account;
import com.examples.moneytracker.accounts.repository.AccountRepository;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository txRepo;
    private final CategoryRepository categoryRepo;
    private final AccountRepository accountRepo;

    @Transactional
    public TransactionResponse create(CreateTransactionRequest req, Long userId) {

        // ===== CHECK ACCOUNT =====
        Account acc = accountRepo.findById(req.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!acc.getUserId().equals(userId)) {
            throw new AccessDeniedException("Not your account");
        }

        // ===== CHECK CATEGORY =====
        Category cat = categoryRepo.findById(req.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        // category mặc định OR category của user
        if (!Boolean.TRUE.equals(cat.getIsDefault())
                && !userId.equals(cat.getUserId())) {
            throw new AccessDeniedException("Not your category");
        }

        // ===== DETERMINE SIGN =====
        BigDecimal signed;
        if ("INCOME".equals(cat.getType())) {
            signed = req.getAmount();
        } else if ("EXPENSE".equals(cat.getType())) {
            signed = req.getAmount().negate();
        } else {
            throw new IllegalStateException("Invalid category type");
        }

        // ===== UPDATE ACCOUNT BALANCE =====
        acc.setCurrentValue(acc.getCurrentValue().add(signed));
        accountRepo.save(acc);

        // ===== SAVE TRANSACTION =====
               Transaction tx = new Transaction();
        tx.setAccountId(acc.getAccountId());
        tx.setCreatedBy(userId);
        tx.setCategoryId(cat.getCategoryId());
        tx.setAmount(req.getAmount());
        tx.setNote(req.getNote());
        tx.setDate(req.getDate());

        txRepo.save(tx);

        return map(tx);
    }

    // ===== MAPPER =====
    private TransactionResponse map(Transaction tx) {
        return new TransactionResponse(
                tx.getTransactionId(),
                tx.getAccountId(),
                tx.getCategoryId(),
                tx.getAmount(),
                tx.getNote(),
                tx.getDate(),
                tx.getCreatedAt()
        );
    }
}
