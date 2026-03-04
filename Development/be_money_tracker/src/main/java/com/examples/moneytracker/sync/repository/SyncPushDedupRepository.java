package com.examples.moneytracker.sync.repository;

import com.examples.moneytracker.sync.model.SyncPushDedup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SyncPushDedupRepository extends JpaRepository<SyncPushDedup, SyncPushDedup.SyncPushDedupId> {
    boolean existsByUserIdAndDeviceIdAndOpId(UUID userId, String deviceId, UUID opId);
}
