package com.examples.moneytracker.event.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * EventMember - Represents a participant in an event
 */
@Entity
@Table(name = "event_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id", "user_id"})
})
@Data
public class EventMember {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Event this member belongs to
     */
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /**
     * User who is a member of the event
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * Role in the event
     * - OWNER: Has full control
     * - MEMBER: Can only CRUD own transactions
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private EventMemberRole role;

    /**
     * Timestamp when user joined the event
     */
    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    /**
     * User who invited this member (null if self-join or owner)
     */
    @Column(name = "invited_by")
    private UUID invitedBy;

    /**
     * Timestamp when record was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Timestamp when record was last updated
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Timestamp when member left or was removed
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Check if this member is the owner
     */
    public boolean isOwner() {
        return this.role == EventMemberRole.OWNER;
    }
}