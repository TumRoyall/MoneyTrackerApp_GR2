package com.examples.moneytracker.budget.service;

import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.dto.CreateBudgetRequest;
import com.examples.moneytracker.budget.dto.UpdateBudgetRequest;
import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.repository.BudgetRepository;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    public BudgetResponse createBudget(CreateBudgetRequest request, UUID userId) {
        walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(request.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setWalletId(request.getWalletId());
        budget.setCategoryId(request.getCategoryId());
        budget.setAmountLimit(request.getAmountLimit());
        budget.setPeriodStart(request.getPeriodStart());
        budget.setPeriodEnd(request.getPeriodEnd());
        budget.setPeriodType(request.getPeriodType());
        budget.setAlertThreshold(request.getAlertThreshold());

        budgetRepository.save(budget);
        return buildResponse(budget, userId);
    }

    public List<BudgetResponse> listBudgets(UUID userId) {
        return budgetRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(budget -> buildResponse(budget, userId))
                .toList();
    }

    public BudgetResponse getBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        return buildResponse(budget, userId);
    }

    public BudgetResponse updateBudget(UUID budgetId, UpdateBudgetRequest request, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        if (request.getWalletId() != null) {
            walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(request.getWalletId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
            budget.setWalletId(request.getWalletId());
        }
        if (request.getCategoryId() != null) {
            budget.setCategoryId(request.getCategoryId());
        }
        if (request.getAmountLimit() != null) {
            budget.setAmountLimit(request.getAmountLimit());
        }
        if (request.getPeriodStart() != null) {
            budget.setPeriodStart(request.getPeriodStart());
        }
        if (request.getPeriodEnd() != null) {
            budget.setPeriodEnd(request.getPeriodEnd());
        }
        if (request.getPeriodType() != null) {
            budget.setPeriodType(request.getPeriodType());
        }
        if (request.getAlertThreshold() != null) {
            budget.setAlertThreshold(request.getAlertThreshold());
        }

        budgetRepository.save(budget);
        return buildResponse(budget, userId);
    }

    public void deleteBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        budget.setDeletedAt(Instant.now());
        budgetRepository.save(budget);
    }

    private BudgetResponse buildResponse(Budget budget, UUID userId) {
        BudgetUsage usage = calculateBudgetUsage(budget, userId);
        return BudgetResponse.from(budget, usage.spentAmount, usage.remainingAmount);
    }

    private BudgetUsage calculateBudgetUsage(Budget budget, UUID userId) {
        var spec = TransactionSpecification.filter(
                userId,
                budget.getWalletId(),
                budget.getCategoryId(),
                "EXPENSE",
                budget.getPeriodStart(),
                budget.getPeriodEnd(),
                null,
                null,
                null
        );

        BigDecimal spent = transactionRepository.findAll(spec)
                .stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = budget.getAmountLimit().subtract(spent);
        return new BudgetUsage(spent, remaining);
    }

    private static class BudgetUsage {
        private final BigDecimal spentAmount;
        private final BigDecimal remainingAmount;

        private BudgetUsage(BigDecimal spentAmount, BigDecimal remainingAmount) {
            this.spentAmount = spentAmount;
            this.remainingAmount = remainingAmount;
        }
    }
}
