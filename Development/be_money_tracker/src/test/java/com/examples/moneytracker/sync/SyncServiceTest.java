package com.examples.moneytracker.sync;

import com.examples.moneytracker.sync.dto.SyncOperation;
import com.examples.moneytracker.sync.dto.SyncPushRequest;
import com.examples.moneytracker.sync.dto.SyncPushResponse;
import com.examples.moneytracker.sync.model.SyncChangeLog;
import com.examples.moneytracker.sync.repository.SyncChangeLogRepository;
import com.examples.moneytracker.sync.repository.SyncPushDedupRepository;
import com.examples.moneytracker.sync.service.SyncChangeLogService;
import com.examples.moneytracker.sync.service.SyncService;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import com.examples.moneytracker.wallet.service.WalletBalanceService;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private SyncChangeLogRepository syncChangeLogRepository;
    @Mock
    private SyncPushDedupRepository syncPushDedupRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private WalletBalanceService walletBalanceService;
    @Mock
    private SyncChangeLogService syncChangeLogService;

    private SyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new SyncService(
                syncChangeLogRepository,
                syncPushDedupRepository,
                walletRepository,
                categoryRepository,
                transactionRepository,
                walletBalanceService,
                syncChangeLogService,
                new ObjectMapper()
        );
    }

    @Test
    void pushDedup_returnsOkWithoutReprocessing() {
        UUID userId = UUID.randomUUID();
        SyncOperation op = new SyncOperation();
        op.setRequestId(UUID.randomUUID().toString());
        op.setEntity("wallets");
        op.setEntityId(UUID.randomUUID().toString());
        op.setOp("UPSERT");

        SyncPushRequest request = new SyncPushRequest("device-1", System.currentTimeMillis(), List.of(op));

        when(syncPushDedupRepository.existsByUserIdAndDeviceIdAndOpId(userId, "device-1", UUID.fromString(op.getRequestId())))
                .thenReturn(true);

        SyncPushResponse response = syncService.push(userId, request);

        assertThat(response.getResults()).hasSize(1);
        assertThat(response.getResults().get(0).getStatus()).isEqualTo("ok");
    }

    @Test
    void pushReturnsConflictWhenBaseVersionMismatch() {
        UUID userId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        Transaction existing = new Transaction();
        existing.setTransactionId(txId);
        existing.setCreatedBy(userId);
        existing.setVersion(2L);
        existing.setWalletId(UUID.randomUUID());
        com.examples.moneytracker.category.model.Category category = new com.examples.moneytracker.category.model.Category();
        category.setCategoryId(UUID.randomUUID());
        existing.setCategory(category);
        existing.setAmount(new java.math.BigDecimal("10.00"));
        existing.setDate(java.time.LocalDate.now());
        existing.setCreatedAt(java.time.Instant.now());
        existing.setUpdatedAt(java.time.Instant.now());

        SyncOperation op = new SyncOperation();
        op.setRequestId(UUID.randomUUID().toString());
        op.setEntity("transactions");
        op.setEntityId(txId.toString());
        op.setOp("UPSERT");
        op.setBaseVersion(1L);

        SyncPushRequest request = new SyncPushRequest("device-1", System.currentTimeMillis(), List.of(op));

        when(syncPushDedupRepository.existsByUserIdAndDeviceIdAndOpId(userId, "device-1", UUID.fromString(op.getRequestId())))
                .thenReturn(false);
        when(transactionRepository.findById(txId)).thenReturn(Optional.of(existing));

        SyncPushResponse response = syncService.push(userId, request);

        assertThat(response.getResults()).hasSize(1);
        assertThat(response.getResults().get(0).getStatus()).isEqualTo("conflict");
        assertThat(response.getResults().get(0).getServerVersion()).isEqualTo(2L);
    }
}
