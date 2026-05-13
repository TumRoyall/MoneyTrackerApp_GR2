package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.GardenReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GardenRewardRepository extends JpaRepository<GardenReward, UUID> {
    List<GardenReward> findByUserId(UUID userId);
}
