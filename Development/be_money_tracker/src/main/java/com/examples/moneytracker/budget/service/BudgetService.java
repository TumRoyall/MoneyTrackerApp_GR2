package com.examples.moneytracker.budget.service;

import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.dto.CreateBudgetRequest;
import com.examples.moneytracker.budget.dto.UpdateBudgetRequest;
import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetResponse createBudget(CreateBudgetRequest request, UUID userId) {
        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setCategoryId(request.getCategoryId());
        budget.setAmountLimit(request.getAmountLimit());
        budget.setPeriodStart(request.getPeriodStart());
        budget.setPeriodEnd(request.getPeriodEnd());
        budget.setPeriodType(request.getPeriodType());
        budget.setAlertThreshold(request.getAlertThreshold());

        budgetRepository.save(budget);
        return BudgetResponse.from(budget);
    }

    public List<BudgetResponse> listBudgets(UUID userId) {
        return budgetRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(BudgetResponse::from)
                .toList();
    }

    public BudgetResponse getBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        return BudgetResponse.from(budget);
    }

    public BudgetResponse updateBudget(UUID budgetId, UpdateBudgetRequest request, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

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
        return BudgetResponse.from(budget);
    }

    public void deleteBudget(UUID budgetId, UUID userId) {
        Budget budget = budgetRepository.findByBudgetIdAndUserIdAndDeletedAtIsNull(budgetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        budget.setDeletedAt(Instant.now());
        budgetRepository.save(budget);
    }
}
