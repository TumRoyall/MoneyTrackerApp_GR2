package com.examples.moneytracker.streak.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_streaks")
public class UserStreak {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private Integer longestStreak = 0;

    @Column(name = "last_active_date")
    private LocalDate lastActiveDate;

    @Column(name = "streak_start_date")
    private LocalDate streakStartDate;

    @Column(name = "reset_hours", nullable = false)
    private Integer resetHours = 40;

    @Column(name = "total_active_days", nullable = false)
    private Integer totalActiveDays = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
