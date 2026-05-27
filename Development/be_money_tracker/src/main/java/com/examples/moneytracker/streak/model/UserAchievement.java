package com.examples.moneytracker.streak.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_achievements")
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "achievement_id")
    private UUID achievementId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private AchievementType type;

    @Column(name = "level", nullable = false)
    private Integer level = 1;

    @Column(name = "achieved_at", nullable = false)
    private Instant achievedAt;

    @Column(name = "context_json", columnDefinition = "TEXT")
    private String contextJson;

    @PrePersist
    public void prePersist() {
        if (this.achievedAt == null) {
            this.achievedAt = Instant.now();
        }
    }
}
