package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.DailyFinancialTask;
import com.examples.moneytracker.garden.model.FinancialTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyFinancialTaskRepository extends JpaRepository<DailyFinancialTask, UUID> {
    List<DailyFinancialTask> findByUserIdAndTaskDate(UUID userId, LocalDate taskDate);

    List<DailyFinancialTask> findByUserIdAndTaskDateBetween(UUID userId, LocalDate from, LocalDate to);

    Optional<DailyFinancialTask> findByTaskIdAndUserId(UUID taskId, UUID userId);

    long countByUserIdAndTaskDateAndStatus(UUID userId, LocalDate taskDate, FinancialTaskStatus status);
}
