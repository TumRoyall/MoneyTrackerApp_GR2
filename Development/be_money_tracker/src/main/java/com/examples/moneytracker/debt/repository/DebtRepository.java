package com.examples.moneytracker.debt.repository;

import com.examples.moneytracker.debt.model.DebtGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DebtRepository extends JpaRepository<DebtGoal, UUID> {
    List<DebtGoal> findByUserIdAndDeletedAtIsNull(UUID userId);
    Optional<DebtGoal> findByDebtIdAndUserIdAndDeletedAtIsNull(UUID debtId, UUID userId);
}
