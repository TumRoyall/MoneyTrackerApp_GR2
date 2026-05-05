package com.examples.moneytracker.budget.service;

import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.dto.CreateBudgetRequest;
import com.examples.moneytracker.budget.dto.UpdateBudgetRequest;
import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetCategory;
import com.examples.moneytracker.budget.repository.BudgetRepository;
import com.examples.moneytracker.budget.repository.BudgetCategoryRepository;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetCategoryRepository budgetCategoryRepository;

    public BudgetResponse createBudget(CreateBudgetRequest request, UUID userId) {
        walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(request.getWalletId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setWalletId(request.getWalletId());
        // Accept either categoryIds list or single categoryId for backward compatibility
        List<UUID> categoryIds = request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()
            ? request.getCategoryIds()
            : (request.getCategoryId() != null ? List.of(request.getCategoryId()) : null);
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new IllegalArgumentException("At least one category is required");
        }
        // keep legacy column populated with first category for compatibility
        budget.setCategoryId(categoryIds.get(0));
        budget.setAmountLimit(request.getAmountLimit());
        budget.setPeriodStart(request.getPeriodStart());
        budget.setPeriodEnd(request.getPeriodEnd());
        budget.setPeriodType(request.getPeriodType());
        budget.setAlertThreshold(request.getAlertThreshold());

        budgetRepository.save(budget);
        // persist budget categories
        List<BudgetCategory> entities = categoryIds.stream()
            .map(catId -> new BudgetCategory(budget.getBudgetId(), catId))
            .collect(Collectors.toList());
        budgetCategoryRepository.saveAll(entities);
        return buildResponse(budget, userId, categoryIds);
    }

    public List<BudgetResponse> listBudgets(UUID userId) {
        List<Budget> budgets = budgetRepository.findByUserIdAndDeletedAtIsNull(userId);
        List<UUID> budgetIds = budgets.stream().map(Budget::getBudgetId).toList();
        List<BudgetCategory> all = budgetCategoryRepository.findByIdBudgetIdIn(budgetIds);
        Map<UUID, List<UUID>> map = all.stream()
            .collect(Collectors.groupingBy(bc -> bc.getId().getBudgetId(),
                Collectors.mapping(bc -> bc.getId().getCategoryId(), Collectors.toList())));

        return budgets.stream()
            .map(budget -> buildResponse(budget, userId, map.getOrDefault(budget.getBudgetId(), List.of())))
            .toList();
    }

    public BudgetResponse getBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        List<BudgetCategory> list = budgetCategoryRepository.findByIdBudgetId(budget.getBudgetId());
        List<UUID> categoryIds = list.stream().map(bc -> bc.getId().getCategoryId()).toList();
        return buildResponse(budget, userId, categoryIds);
    }

    public BudgetResponse updateBudget(UUID budgetId, UpdateBudgetRequest request, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        if (request.getWalletId() != null) {
            walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(request.getWalletId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
            budget.setWalletId(request.getWalletId());
        }
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            // update join table: replace existing categories
            budgetCategoryRepository.deleteByIdBudgetId(budget.getBudgetId());
            List<BudgetCategory> entities = request.getCategoryIds().stream()
                    .map(catId -> new BudgetCategory(budget.getBudgetId(), catId))
                    .collect(Collectors.toList());
            budgetCategoryRepository.saveAll(entities);
            // update legacy column
            budget.setCategoryId(request.getCategoryIds().get(0));
        } else if (request.getCategoryId() != null) {
            budget.setCategoryId(request.getCategoryId());
            // keep join table in sync: replace with single id
            budgetCategoryRepository.deleteByIdBudgetId(budget.getBudgetId());
            budgetCategoryRepository.saveAll(List.of(new BudgetCategory(budget.getBudgetId(), request.getCategoryId())));
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
        List<BudgetCategory> list = budgetCategoryRepository.findByIdBudgetId(budget.getBudgetId());
        List<UUID> categoryIds = list.stream().map(bc -> bc.getId().getCategoryId()).toList();
        return buildResponse(budget, userId, categoryIds);
    }

    public void deleteBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        budget.setDeletedAt(Instant.now());
        budgetRepository.save(budget);
    }

    private BudgetResponse buildResponse(Budget budget, UUID userId, List<UUID> categoryIds) {
        BudgetUsage usage = calculateBudgetUsage(budget, userId, categoryIds);
        return BudgetResponse.from(budget, usage.spentAmount, usage.remainingAmount, categoryIds);
    }

        private BudgetUsage calculateBudgetUsage(Budget budget, UUID userId, List<UUID> categoryIds) {
        var spec = Specification
            .where(TransactionSpecification.hasUser(userId))
            .and(TransactionSpecification.hasWallet(budget.getWalletId()))
            .and(TransactionSpecification.hasCategories(categoryIds))
            .and(TransactionSpecification.hasType("EXPENSE"))
            .and(TransactionSpecification.fromDate(budget.getPeriodStart()))
            .and(TransactionSpecification.toDate(budget.getPeriodEnd()));

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
