package com.examples.moneytracker.garden.repository;

import com.examples.moneytracker.garden.model.UserGardenStreak;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserGardenStreakRepository extends JpaRepository<UserGardenStreak, UUID> {
    Optional<UserGardenStreak> findByUserId(UUID userId);
}
