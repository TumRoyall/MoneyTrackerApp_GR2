package com.examples.moneytracker.garden.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "daily_financial_tasks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_task_user_date_type", columnNames = {"user_id", "task_date", "task_type"})
    },
    indexes = {
        @Index(name = "idx_task_user_date", columnList = "user_id, task_date"),
        @Index(name = "idx_task_session", columnList = "plant_session_id")
    }
)
@Data
public class DailyFinancialTask {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID taskId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_session_id")
    private PlantSession plantSession;

    @Column(name = "task_date", nullable = false)
    private LocalDate taskDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", length = 40, nullable = false)
    private FinancialTaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FinancialTaskStatus status = FinancialTaskStatus.PENDING;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "score_delta", nullable = false)
    private Integer scoreDelta = 0;

    @Column(name = "xp_reward", nullable = false)
    private Integer xpReward = 0;

    @Column(name = "is_random", nullable = false)
    private Boolean isRandom = false;

    @Column(name = "completed_at")
    private Instant completedAt;

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
}
