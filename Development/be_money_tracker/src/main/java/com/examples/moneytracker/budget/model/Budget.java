package com.examples.moneytracker.budget.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budgets")
@Data
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID budgetId;

    @Column(nullable = false)
    private UUID userId;

    @Column
    private UUID walletId;

    @Column(name = "title")
    private String title;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amountLimit;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false)
    private BudgetPeriodType periodType;

    @Column(name = "alert_threshold", precision = 5, scale = 2)
    private BigDecimal alertThreshold;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20)
    private BudgetSource source;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "draft_id")
    private UUID draftId;

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
        if (this.source == null) {
            this.source = BudgetSource.MANUAL;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
