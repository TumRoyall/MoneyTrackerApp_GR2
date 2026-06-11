package com.examples.moneytracker.frameworks.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "framework_settings")
@Data
public class FrameworkSetting {

    @Id
    private UUID userId;

    @Column(name = "framework_type")
    private String frameworkType;

    @Column(name = "params_json", columnDefinition = "TEXT")
    private String paramsJson;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }
}
