package com.examples.moneytracker.debt.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "debts")
@Data
public class DebtGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID debtId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID walletId;

    @Column(nullable = false)
    private String title;

    @Column(name = "target_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal targetAmount;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "target_date")
    private LocalDate targetDate;

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
