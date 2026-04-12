package com.examples.moneytracker.sync.repository;

import com.examples.moneytracker.sync.model.SyncChangeLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SyncChangeLogRepository extends JpaRepository<SyncChangeLog, Long> {
    List<SyncChangeLog> findByUserIdAndCursorIdGreaterThanOrderByCursorIdAsc(UUID userId, Long cursorId, Pageable pageable);
}
