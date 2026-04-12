package com.examples.moneytracker.category.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Data
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID categoryId;

    /**
     * NULL  -> category mặc định (system)
     * != NULL -> category của user
     */
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String name;

    /**
     * EXPENSE / INCOME
     */
    @Column(nullable = false)
    private String type;

    private String icon;

    private String color;

    /**
     * true  -> category mặc định
     * false -> category user tạo
     */
    @Column(nullable = false)
    private Boolean isDefault = false;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

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
