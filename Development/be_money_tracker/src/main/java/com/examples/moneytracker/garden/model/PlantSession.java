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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "plant_sessions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_plant_sessions_user_month", columnNames = {"user_id", "month_start"})
    },
    indexes = {
        @Index(name = "idx_plant_sessions_user", columnList = "user_id"),
        @Index(name = "idx_plant_sessions_user_month", columnList = "user_id, month_start"),
        @Index(name = "idx_plant_sessions_status", columnList = "status")
    }
)
@Data
public class PlantSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID plantSessionId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flower_type_id", nullable = false)
    private FlowerType flowerType;

    @Column(name = "month_start", nullable = false)
    private LocalDate monthStart;

    @Column(name = "month_end", nullable = false)
    private LocalDate monthEnd;

    @Column(name = "seed_selected_date")
    private LocalDate seedSelectedDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private PlantSessionStatus status = PlantSessionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", length = 30, nullable = false)
    private FlowerStage currentStage = FlowerStage.SEED;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_quality", length = 20, nullable = false)
    private FlowerQuality currentQuality = FlowerQuality.AVERAGE;

    @Column(name = "current_score", nullable = false)
    private Integer currentScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "mutation_type", length = 30, nullable = false)
    private GardenMutationType mutationType = GardenMutationType.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_rank", length = 30)
    private GardenRank finalRank;

    @Column(name = "final_score")
    private Integer finalScore;

    @Column(name = "final_savings_ratio", precision = 6, scale = 4)
    private BigDecimal finalSavingsRatio;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

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
