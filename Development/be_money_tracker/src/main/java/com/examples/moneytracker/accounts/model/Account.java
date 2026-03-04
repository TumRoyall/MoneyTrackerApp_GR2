package com.examples.moneytracker.accounts.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Data
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID accountId;

    private UUID userId;

    @Enumerated(EnumType.STRING)            // REGULAR / CASH / SAVING / DEBT / INVEST / EVENT
    @Column(length = 20, nullable = false)
    private AccountType type;

    private String accountName;

    @Column(precision = 18, scale = 2)
    private BigDecimal currentValue;

    private String currency;

    private String description;

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
