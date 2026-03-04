package com.examples.moneytracker.sync.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sync_push_dedup")
@Getter
@Setter
@IdClass(SyncPushDedup.SyncPushDedupId.class)
public class SyncPushDedup {

    @Id
    @Column(nullable = false)
    private UUID userId;

    @Id
    @Column(nullable = false, length = 100)
    private String deviceId;

    @Id
    @Column(nullable = false)
    private UUID opId;

    @Column(nullable = false)
    private Instant receivedAt;

    @PrePersist
    public void prePersist() {
        if (receivedAt == null) {
            receivedAt = Instant.now();
        }
    }

    // Composite Key Class
    @Getter
    @Setter
    public static class SyncPushDedupId implements Serializable {
        private UUID userId;
        private String deviceId;
        private UUID opId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SyncPushDedupId)) return false;
            SyncPushDedupId that = (SyncPushDedupId) o;
            return userId.equals(that.userId) && deviceId.equals(that.deviceId) && opId.equals(that.opId);
        }

        @Override
        public int hashCode() {
            return userId.hashCode() + deviceId.hashCode() + opId.hashCode();
        }
    }
}
