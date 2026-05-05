package com.examples.moneytracker.budget.repository;

import com.examples.moneytracker.budget.model.BudgetCategory;
import com.examples.moneytracker.budget.model.BudgetCategory.BudgetCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, BudgetCategoryId> {
    List<BudgetCategory> findByIdBudgetIdIn(Collection<UUID> budgetIds);
    List<BudgetCategory> findByIdBudgetId(UUID budgetId);
    void deleteByIdBudgetId(UUID budgetId);
}
