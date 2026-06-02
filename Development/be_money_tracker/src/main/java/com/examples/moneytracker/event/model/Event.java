package com.examples.moneytracker.event.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Event - A shared expense tracker for a specific event
 * Examples: badminton session, birthday party, company trip
 */
@Entity
@Table(name = "events")
@Data
public class Event {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID eventId;

    /**
     * Event name
     * Example: "Cầu lông Chủ Nhật"
     */
    @Column(nullable = false)
    private String name;

    /**
     * Icon/emoji for the event
     * Example: "🏸"
     */
    @Column(length = 50)
    private String icon;

    /**
     * Event description
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Event status
     * - ACTIVE: Can add transactions
     * - SETTLED: Settlement completed, read-only
     * - ARCHIVED: Archived by owner, read-only
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_status", length = 20, nullable = false)
    private EventStatus status;

    /**
     * 6-character share code for joining event
     * Example: "ABC123"
     */
    @Column(name = "share_code", length = 10, unique = true)
    private String shareCode;

    /**
     * Full share link for event
     * Example: "https://moneytracker.app/e/ABC123"
     */
    @Column(name = "share_link", length = 255)
    private String shareLink;

    /**
     * Start date for event (optional)
     */
    @Column(name = "start_date")
    private Instant startDate;

    /**
     * End date for event (optional)
     */
    @Column(name = "end_date")
    private Instant endDate;

    /**
     * User who created the event (owner)
     */
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /**
     * Timestamp when event was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Timestamp when event was last updated
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Timestamp when event was deleted (soft delete)
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Version for optimistic locking
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    public void prePersist() {
        if (this.eventId == null) {
            this.eventId = UUID.randomUUID();
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = EventStatus.ACTIVE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Check if event is active (can add transactions)
     */
    public boolean isActive() {
        return this.status == EventStatus.ACTIVE;
    }

    /**
     * Check if event can be modified
     */
    public boolean isModifiable() {
        return this.status == EventStatus.ACTIVE;
    }
}