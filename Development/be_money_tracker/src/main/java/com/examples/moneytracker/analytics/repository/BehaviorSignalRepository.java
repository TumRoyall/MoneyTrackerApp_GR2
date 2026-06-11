package com.examples.moneytracker.analytics.repository;

import com.examples.moneytracker.analytics.model.BehaviorSignal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BehaviorSignalRepository extends JpaRepository<BehaviorSignal, UUID> {
    List<BehaviorSignal> findByUserIdAndWindowStartLessThanEqualAndWindowEndGreaterThanEqual(
            UUID userId,
            LocalDate start,
            LocalDate end
    );
}
