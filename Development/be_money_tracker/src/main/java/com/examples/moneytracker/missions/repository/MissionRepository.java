package com.examples.moneytracker.missions.repository;

import com.examples.moneytracker.missions.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MissionRepository extends JpaRepository<Mission, UUID> {
    List<Mission> findByUserIdAndStatus(UUID userId, String status);
}
