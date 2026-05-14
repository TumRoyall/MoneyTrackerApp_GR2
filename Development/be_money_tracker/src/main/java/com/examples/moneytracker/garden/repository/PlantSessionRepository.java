package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.PlantSession;
import com.examples.moneytracker.garden.model.PlantSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantSessionRepository extends JpaRepository<PlantSession, UUID> {
    Optional<PlantSession> findByUserIdAndMonthStart(UUID userId, LocalDate monthStart);

    Optional<PlantSession> findByUserIdAndStatus(UUID userId, PlantSessionStatus status);

    List<PlantSession> findByStatusAndMonthEnd(PlantSessionStatus status, LocalDate monthEnd);
}
