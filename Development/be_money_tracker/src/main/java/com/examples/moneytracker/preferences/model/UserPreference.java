package com.examples.moneytracker.preferences.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Data
public class UserPreference {

    @Id
    private UUID userId;

    private String coachingStyle;

    private String tone;

    private String frameworkPreference;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }
}
