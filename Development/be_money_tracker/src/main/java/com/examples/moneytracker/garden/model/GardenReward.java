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
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "garden_rewards",
    indexes = {
        @Index(name = "idx_garden_rewards_user", columnList = "user_id"),
        @Index(name = "idx_garden_rewards_session", columnList = "plant_session_id")
    }
)
@Data
public class GardenReward {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID rewardId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_session_id")
    private PlantSession plantSession;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", length = 40, nullable = false)
    private GardenRewardType rewardType;

    @Column(name = "reward_value", nullable = false)
    private Integer rewardValue = 0;

    @Column(name = "reward_payload", columnDefinition = "TEXT")
    private String rewardPayload;

    @Column(name = "source", length = 60)
    private String source;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Long version = 1L;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
