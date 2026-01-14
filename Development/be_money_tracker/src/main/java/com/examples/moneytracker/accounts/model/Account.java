package com.examples.moneytracker.accounts.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "accounts")
@Data
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    private Long userId;

    @Enumerated(EnumType.STRING)            // REGULAR / CASH / SAVING / DEBT / INVEST / EVENT
    @Column(length = 20, nullable = false)
    private AccountType type;

    private String accountName;

    @Column(precision = 18, scale = 2)
    private BigDecimal currentValue;

    private String currency;

    private String description;

    @Column(nullable = false)
    private Boolean deleted = false;

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
