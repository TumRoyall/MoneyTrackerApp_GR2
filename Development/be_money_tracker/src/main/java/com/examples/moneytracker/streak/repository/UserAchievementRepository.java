package com.examples.moneytracker.streak.repository;

import com.examples.moneytracker.streak.model.AchievementType;
import com.examples.moneytracker.streak.model.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {
    List<UserAchievement> findByUserIdOrderByAchievedAtDesc(UUID userId);
    List<UserAchievement> findByUserIdAndType(UUID userId, AchievementType type);
    boolean existsByUserIdAndTypeAndLevel(UUID userId, AchievementType type, Integer level);
}
