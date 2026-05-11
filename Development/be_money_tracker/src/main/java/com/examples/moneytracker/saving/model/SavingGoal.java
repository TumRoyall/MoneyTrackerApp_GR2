package com.examples.moneytracker.saving.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "savings")
@Data
public class SavingGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID savingId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID walletId;

    @Column(nullable = false)
    private String title;

    @Column(name = "target_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal targetAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private SavingType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_unit", length = 20)
    private SavingPeriodUnit periodUnit;

    @Column(name = "start_period")
    private LocalDate startPeriod;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(nullable = false)
    private Long version = 1L;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

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
