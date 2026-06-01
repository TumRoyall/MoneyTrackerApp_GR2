package com.examples.moneytracker.sync.service;

import com.examples.moneytracker.sync.model.SyncChangeLog;
import com.examples.moneytracker.sync.repository.SyncChangeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SyncChangeLogService {

    private final SyncChangeLogRepository syncChangeLogRepository;

    @Transactional
    public void recordChange(UUID userId, String entity, UUID entityId, String op) {
        SyncChangeLog log = new SyncChangeLog();
        log.setUserId(userId);
        log.setEntity(entity);
        log.setEntityPk(entityId);
        log.setOp(op);
        syncChangeLogRepository.save(log);
    }
}
