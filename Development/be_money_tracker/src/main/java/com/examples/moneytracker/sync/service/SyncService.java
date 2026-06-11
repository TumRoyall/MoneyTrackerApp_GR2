package com.examples.moneytracker.sync.service;

import com.examples.moneytracker.sync.dto.*;
import com.examples.moneytracker.sync.model.SyncChangeLog;
import com.examples.moneytracker.sync.model.SyncPushDedup;
import com.examples.moneytracker.sync.repository.SyncChangeLogRepository;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.sync.repository.SyncPushDedupRepository;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.model.TransactionType;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.wallet.dto.WalletResponse;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import com.examples.moneytracker.wallet.service.WalletBalanceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SyncService {

    // Categories are no longer synced — they are static system data that
    // ships with the app (seeded on the client and on the server at boot).
    // Budgets are also not yet supported; keep the name in the set so any
    // legacy client that still sends "categories" gets a clear error rather
    // than a generic "Unknown entity".
    private static final Set<String> SUPPORTED_ENTITIES = Set.of("wallets", "transactions", "budgets");

    private final SyncChangeLogRepository syncChangeLogRepository;
    private final SyncPushDedupRepository syncPushDedupRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final WalletBalanceService walletBalanceService;
    private final SyncChangeLogService syncChangeLogService;
    private final ObjectMapper objectMapper;

    public SyncPullResponse pull(UUID userId, Long cursor, Integer limit) {
        long safeCursor = (cursor == null || cursor < 0) ? 0L : cursor;
        int safeLimit = limit == null ? 500 : Math.max(1, Math.min(limit, 1000));

        if (safeCursor == 0L) {
            List<WalletResponse> walletChanges = walletRepository.findByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(WalletResponse::from)
                .toList();

            List<TransactionResponse> transactionChanges = transactionRepository.findByCreatedByAndDeletedAtIsNull(userId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();

            Map<String, List<?>> changes = new LinkedHashMap<>();
            changes.put("wallets", walletChanges);
            changes.put("budgets", List.of());
            changes.put("transactions", transactionChanges);

            Map<String, List<UUID>> deletes = new LinkedHashMap<>();
            deletes.put("wallets", walletRepository.findByUserIdAndDeletedAtIsNotNull(userId)
                .stream()
                .map(Wallet::getWalletId)
                .toList());
            deletes.put("budgets", List.of());
            deletes.put("transactions", transactionRepository.findByCreatedByAndDeletedAtIsNotNull(userId)
                .stream()
                .map(Transaction::getTransactionId)
                .toList());

            long nextCursor = syncChangeLogRepository.findTopByUserIdOrderByCursorIdDesc(userId)
                .map(SyncChangeLog::getCursorId)
                .orElse(0L);

            return SyncPullResponse.builder()
                .nextCursor(nextCursor)
                .hasMore(false)
                .changes(changes)
                .deletes(deletes)
                .build();
        }

        List<SyncChangeLog> logs = syncChangeLogRepository.findByUserIdAndCursorIdGreaterThanOrderByCursorIdAsc(
                userId,
                safeCursor,
                PageRequest.of(0, safeLimit + 1)
        );

        boolean hasMore = logs.size() > safeLimit;
        List<SyncChangeLog> pageLogs = hasMore ? logs.subList(0, safeLimit) : logs;
        long nextCursor = pageLogs.isEmpty() ? safeCursor : pageLogs.get(pageLogs.size() - 1).getCursorId();

        Map<String, SyncChangeLog> latestPerEntityPk = new LinkedHashMap<>();
        for (SyncChangeLog log : pageLogs) {
            if (!SUPPORTED_ENTITIES.contains(log.getEntity())) {
                continue;
            }
            latestPerEntityPk.put(log.getEntity() + ":" + log.getEntityPk(), log);
        }

        Set<UUID> walletUpserts = new LinkedHashSet<>();
        Set<UUID> transactionUpserts = new LinkedHashSet<>();

        Set<UUID> walletDeletes = new LinkedHashSet<>();
        Set<UUID> transactionDeletes = new LinkedHashSet<>();
        Set<UUID> budgetDeletes = new LinkedHashSet<>();

        for (SyncChangeLog log : latestPerEntityPk.values()) {
            boolean isDelete = "DELETE".equalsIgnoreCase(log.getOp());
            UUID id = log.getEntityPk();

            switch (log.getEntity()) {
                case "wallets" -> {
                    if (isDelete) walletDeletes.add(id);
                    else walletUpserts.add(id);
                }
                case "transactions" -> {
                    if (isDelete) transactionDeletes.add(id);
                    else transactionUpserts.add(id);
                }
                case "budgets" -> {
                    if (isDelete) budgetDeletes.add(id);
                }
                default -> {
                    // Categories sync is no longer supported — skip silently.
                }
            }
        }

        List<WalletResponse> walletChanges = walletUpserts.isEmpty()
            ? List.of()
            : walletRepository.findByUserIdAndWalletIdInAndDeletedAtIsNull(userId, walletUpserts)
            .stream()
            .map(WalletResponse::from)
            .toList();

        List<TransactionResponse> transactionChanges = transactionUpserts.isEmpty()
                ? List.of()
                : transactionRepository.findByCreatedByAndTransactionIdInAndDeletedAtIsNull(userId, transactionUpserts)
                .stream()
                .map(this::toTransactionResponse)
                .toList();

        Map<String, List<?>> changes = new LinkedHashMap<>();
        changes.put("wallets", walletChanges);
        changes.put("budgets", List.of());
        changes.put("transactions", transactionChanges);

        Map<String, List<UUID>> deletes = new LinkedHashMap<>();
        deletes.put("wallets", List.copyOf(walletDeletes));
        deletes.put("budgets", List.copyOf(budgetDeletes));
        deletes.put("transactions", List.copyOf(transactionDeletes));

        return SyncPullResponse.builder()
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .changes(changes)
                .deletes(deletes)
                .build();
    }

    private TransactionResponse toTransactionResponse(Transaction tx) {
        return new TransactionResponse(
            tx.getTransactionId(),
            tx.getWalletId(),
            tx.getCategoryId(),
            tx.getAmount(),
            tx.getType() != null ? tx.getType().name() : null,
            tx.getNote(),
            tx.getDate(),
            tx.getCreatedAt(),
            tx.getUpdatedAt(),
            tx.getDeletedAt(),
            tx.getVersion()
        );
    }

    // ========== PUSH API ==========

    public SyncPushResponse push(UUID userId, SyncPushRequest request) {
        List<SyncOperationResult> results = new ArrayList<>();

        for (SyncOperation op : request.getOperations()) {
            try {
                // Check idempotent
                UUID opId = UUID.fromString(op.getRequestId());
                if (syncPushDedupRepository.existsByUserIdAndDeviceIdAndOpId(userId, request.getDeviceId(), opId)) {
                    // Already processed, return ok
                    results.add(buildOkResult(op, null));
                    continue;
                }

                SyncOperationResult result = processOperation(userId, op);
                results.add(result);

                // Mark as processed if ok
                if ("ok".equals(result.getStatus())) {
                    markAsProcessed(userId, request.getDeviceId(), opId);
                }
            } catch (Exception e) {
                results.add(buildErrorResult(op, e.getMessage()));
            }
        }

        return SyncPushResponse.builder()
                .results(results)
                .build();
    }

    @Transactional
    protected SyncOperationResult processOperation(UUID userId, SyncOperation op) {
        switch (op.getEntity()) {
            case "wallets":
                return processWalletOperation(userId, op);
            case "transactions":
                return processTransactionOperation(userId, op);
            case "categories":
                // Categories are static system data — clients no longer push them.
                return buildErrorResult(op, "Categories are not synced; managed by app and server seed");
            case "budgets":
                // Skip budgets - not implemented yet
                return buildErrorResult(op, "Budgets not supported yet");
            default:
                throw new IllegalArgumentException("Unknown entity: " + op.getEntity());
        }
    }

    @Transactional
    protected SyncOperationResult processWalletOperation(UUID userId, SyncOperation op) {
        UUID entityId = UUID.fromString(op.getEntityId());
        Optional<Wallet> existingOpt = walletRepository.findById(entityId);

        // Check conflict
        if (existingOpt.isPresent()) {
            Wallet existing = existingOpt.get();
            if (!existing.getUserId().equals(userId)) {
                return buildErrorResult(op, "Access denied: not your wallet");
            }
            if (existingOpt.isPresent()) {
                if (op.getBaseVersion() == null) {
                    return buildErrorResult(op, "baseVersion is required for update/delete");
                }
                if (!op.getBaseVersion().equals(existing.getVersion())) {
                    return buildConflictResult(op, existing.getVersion(), walletToMap(existing));
                }
            }
        }

        if ("DELETE".equalsIgnoreCase(op.getOp())) {
            if (existingOpt.isEmpty()) {
                return buildOkResult(op, null);
            }
            Wallet wallet = existingOpt.get();
            wallet.setDeletedAt(Instant.now());
            walletRepository.save(wallet);
            syncChangeLogService.recordChange(userId, "wallets", wallet.getWalletId(), "DELETE");
            return buildOkResult(op, wallet.getVersion());
        } else {
            // UPSERT
            WalletPushData data = objectMapper.convertValue(op.getData(), WalletPushData.class);
            Wallet wallet = existingOpt.orElse(new Wallet());
            wallet.setWalletId(entityId);
            wallet.setUserId(userId);
            wallet.setName(data.getName());
            wallet.setType(data.getWalletType());
            wallet.setCurrency(data.getCurrency() != null ? data.getCurrency() : "VND");
            if (data.getOpeningBalance() != null) {
                wallet.setOpeningBalance(data.getOpeningBalance());
            } else if (wallet.getOpeningBalance() == null) {
                wallet.setOpeningBalance(java.math.BigDecimal.ZERO);
            }
            wallet.setDescription(data.getDescription());
            if (data.getDeletedAt() != null) {
                wallet.setDeletedAt(Instant.ofEpochMilli(data.getDeletedAt()));
            }
            walletRepository.save(wallet);
            walletBalanceService.rebuildWalletBalance(wallet);
            return buildOkResult(op, wallet.getVersion());
        }
    }

    @Transactional
    protected SyncOperationResult processTransactionOperation(UUID userId, SyncOperation op) {
        UUID entityId = UUID.fromString(op.getEntityId());
        Optional<Transaction> existingOpt = transactionRepository.findById(entityId);
        BigDecimal oldAmount = null;
        TransactionType oldType = null;

        // Check conflict
        if (existingOpt.isPresent()) {
            Transaction existing = existingOpt.get();
            if (!existing.getCreatedBy().equals(userId)) {
                return buildErrorResult(op, "Access denied: not your transaction");
            }
            if (existingOpt.isPresent()) {
                if (op.getBaseVersion() == null) {
                    return buildErrorResult(op, "baseVersion is required for update/delete");
                }
                if (!op.getBaseVersion().equals(existing.getVersion())) {
                    return buildConflictResult(op, existing.getVersion(), transactionToMap(existing));
                }
                oldAmount = existing.getAmount();
                oldType = existing.getType() != null
                    ? existing.getType()
                    : resolveType(null, existing.getCategory().getType(), TransactionType.EXPENSE);
            }
        }

        if ("DELETE".equalsIgnoreCase(op.getOp())) {
            if (existingOpt.isEmpty()) {
                return buildOkResult(op, null);
            }
            Transaction tx = existingOpt.get();
            if (tx.getDeletedAt() != null) {
                return buildOkResult(op, tx.getVersion());
            }
            Wallet wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(tx.getWalletId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
            walletBalanceService.applyTransactionDelete(wallet, tx);
            tx.setDeletedAt(Instant.now());
            transactionRepository.save(tx);
            syncChangeLogService.recordChange(userId, "transactions", tx.getTransactionId(), "DELETE");
            return buildOkResult(op, tx.getVersion());
        } else {
            // UPSERT
            TransactionPushData data = objectMapper.convertValue(op.getData(), TransactionPushData.class);
            Transaction tx = existingOpt.orElse(new Transaction());

            // Parse categoryId from string to UUID
            UUID categoryId;
            try {
                categoryId = data.getCategoryId() != null ? UUID.fromString(data.getCategoryId()) : null;
            } catch (IllegalArgumentException e) {
                return buildErrorResult(op, "Invalid categoryId format: " + data.getCategoryId());
            }
            if (categoryId == null) {
                return buildErrorResult(op, "categoryId is required");
            }

            // Get category
            Category category = categoryRepository.findByCategoryIdRaw(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + data.getCategoryId()));

            // Verify user has access to this category
            if (category.getUserId() != null && !category.getUserId().equals(userId)) {
                return buildErrorResult(op, "Access denied: not your category");
            }

            // Set categoryId as UUID
            tx.setCategoryId(categoryId);

            UUID walletId = data.getWalletId() != null ? UUID.fromString(data.getWalletId()) : null;
            if (walletId == null && tx.getWalletId() != null) {
                walletId = tx.getWalletId();
            }
            Wallet wallet = null;
            if (walletId != null) {
                wallet = walletRepository.findByWalletIdAndUserIdAndDeletedAtIsNull(walletId, userId)
                        .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));
            }

            tx.setTransactionId(entityId);
            if (tx.getWalletId() != null && walletId != null && !tx.getWalletId().equals(walletId)) {
                return buildConflictResult(op, tx.getVersion(), transactionToMap(tx));
            }
            if (walletId == null) {
                return buildErrorResult(op, "walletId is required for transaction");
            }
            tx.setWalletId(walletId);
            tx.setCreatedBy(userId);
            tx.setCategoryId(categoryId);
            tx.setAmount(data.getAmount());
            tx.setType(resolveType(data.getType(), category.getType(), tx.getType()));
            tx.setNote(data.getNote());
            tx.setDate(data.getTxDate() != null ? LocalDate.parse(data.getTxDate()) : LocalDate.now());
            if (data.getDeletedAt() != null) {
                tx.setDeletedAt(Instant.ofEpochMilli(data.getDeletedAt()));
            }
            transactionRepository.save(tx);
            if (wallet != null) {
                if (existingOpt.isPresent()) {
                    walletBalanceService.applyTransactionUpdate(wallet, oldAmount, oldType, tx.getAmount(), tx.getType());
                } else {
                    walletBalanceService.applyTransactionCreate(wallet, tx);
                }
            }
            syncChangeLogService.recordChange(userId, "transactions", tx.getTransactionId(), "UPSERT");
            return buildOkResult(op, tx.getVersion());
        }
    }

    private void markAsProcessed(UUID userId, String deviceId, UUID opId) {
        SyncPushDedup dedup = new SyncPushDedup();
        dedup.setUserId(userId);
        dedup.setDeviceId(deviceId);
        dedup.setOpId(opId);
        syncPushDedupRepository.save(dedup);
    }

    private SyncOperationResult buildOkResult(SyncOperation op, Long newVersion) {
        return SyncOperationResult.builder()
                .outboxId(op.getOutboxId())
                .requestId(op.getRequestId())
                .status("ok")
                .newVersion(newVersion)
                .build();
    }

    private SyncOperationResult buildConflictResult(SyncOperation op, Long serverVersion, Map<String, Object> serverData) {
        return SyncOperationResult.builder()
                .outboxId(op.getOutboxId())
                .requestId(op.getRequestId())
                .status("conflict")
                .serverVersion(serverVersion)
                .serverData(serverData)
                .build();
    }

    private SyncOperationResult buildErrorResult(SyncOperation op, String error) {
        return SyncOperationResult.builder()
                .outboxId(op.getOutboxId())
                .requestId(op.getRequestId())
                .status("error")
                .error(error)
                .build();
    }

    private Map<String, Object> walletToMap(Wallet wallet) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("walletId", wallet.getWalletId().toString());
        map.put("name", wallet.getName());
        map.put("type", wallet.getType().name());
        map.put("currency", wallet.getCurrency());
        map.put("openingBalance", wallet.getOpeningBalance());
        map.put("currentBalance", wallet.getCurrentBalance());
        map.put("description", wallet.getDescription());
        map.put("version", wallet.getVersion());
        map.put("createdAt", wallet.getCreatedAt().toEpochMilli());
        map.put("updatedAt", wallet.getUpdatedAt().toEpochMilli());
        map.put("deletedAt", wallet.getDeletedAt() != null ? wallet.getDeletedAt().toEpochMilli() : null);
        return map;
    }

    private Map<String, Object> transactionToMap(Transaction tx) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("transactionId", tx.getTransactionId().toString());
        map.put("walletId", tx.getWalletId().toString());
        map.put("categoryId", tx.getCategoryId());
        map.put("amount", tx.getAmount());
        map.put("type", tx.getType() != null ? tx.getType().name() : null);
        map.put("note", tx.getNote());
        map.put("txDate", tx.getDate().toString());
        map.put("version", tx.getVersion());
        map.put("createdAt", tx.getCreatedAt().toEpochMilli());
        map.put("updatedAt", tx.getUpdatedAt().toEpochMilli());
        map.put("deletedAt", tx.getDeletedAt() != null ? tx.getDeletedAt().toEpochMilli() : null);
        return map;
    }

    private TransactionType resolveType(String requestedType, String categoryType, TransactionType fallback) {
        TransactionType requested = parseType(requestedType);
        if (requested != null) {
            return requested;
        }

        TransactionType fromCategory = parseType(categoryType);
        if (fromCategory != null) {
            return fromCategory;
        }

        return fallback != null ? fallback : TransactionType.EXPENSE;
    }

    private TransactionType parseType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return TransactionType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
