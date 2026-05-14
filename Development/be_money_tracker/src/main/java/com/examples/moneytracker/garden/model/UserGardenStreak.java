package com.examples.moneytracker.garden.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "user_garden_streaks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_garden_streak_user", columnNames = {"user_id"})
    },
    indexes = {
        @Index(name = "idx_garden_streak_user", columnList = "user_id")
    }
)
@Data
public class UserGardenStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID streakId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private Integer longestStreak = 0;

    @Column(name = "last_completed_date")
    private LocalDate lastCompletedDate;

    @Column(name = "last_rewarded_at")
    private Instant lastRewardedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private Long version = 1L;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
