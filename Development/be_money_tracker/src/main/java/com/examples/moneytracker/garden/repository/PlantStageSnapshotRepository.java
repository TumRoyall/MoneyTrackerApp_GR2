package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.PlantStageSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantStageSnapshotRepository extends JpaRepository<PlantStageSnapshot, UUID> {
    Optional<PlantStageSnapshot> findByPlantSessionPlantSessionIdAndSnapshotDate(UUID plantSessionId, LocalDate snapshotDate);

    List<PlantStageSnapshot> findByPlantSessionPlantSessionIdOrderBySnapshotDate(UUID plantSessionId);
}
