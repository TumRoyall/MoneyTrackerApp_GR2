package com.examples.moneytracker.insights.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "insights")
@Data
public class Insight {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID insightId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String type;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "shown_at")
    private Instant shownAt;

    private String feedback;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
