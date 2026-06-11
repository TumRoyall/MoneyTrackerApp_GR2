package com.examples.moneytracker.budget.repository;

import com.examples.moneytracker.budget.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByUserIdAndDeletedAtIsNull(UUID userId);
    Optional<Budget> findByBudgetIdAndUserIdAndDeletedAtIsNull(UUID budgetId, UUID userId);
}
