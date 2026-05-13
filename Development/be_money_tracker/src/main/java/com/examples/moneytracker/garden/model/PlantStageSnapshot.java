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
    name = "plant_stage_snapshots",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_snapshot_session_date", columnNames = {"plant_session_id", "snapshot_date"})
    },
    indexes = {
        @Index(name = "idx_snapshot_session", columnList = "plant_session_id"),
        @Index(name = "idx_snapshot_session_date", columnList = "plant_session_id, snapshot_date")
    }
)
@Data
public class PlantStageSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID snapshotId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plant_session_id", nullable = false)
    private PlantSession plantSession;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "day_of_month", nullable = false)
    private Integer dayOfMonth;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private FlowerStage stage;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FlowerQuality quality;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "is_finalized", nullable = false)
    private Boolean isFinalized = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Long version = 1L;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
