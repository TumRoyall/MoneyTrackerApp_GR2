package com.examples.moneytracker.saving.repository;

import com.examples.moneytracker.saving.model.SavingGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavingRepository extends JpaRepository<SavingGoal, UUID> {
    List<SavingGoal> findByUserIdAndDeletedAtIsNull(UUID userId);
    Optional<SavingGoal> findBySavingIdAndUserIdAndDeletedAtIsNull(UUID savingId, UUID userId);
}
