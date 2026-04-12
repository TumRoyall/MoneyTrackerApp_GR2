package com.examples.moneytracker.sync.service;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.sync.dto.*;
import com.examples.moneytracker.sync.model.SyncChangeLog;
import com.examples.moneytracker.sync.model.SyncPushDedup;
import com.examples.moneytracker.sync.repository.SyncChangeLogRepository;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.sync.repository.SyncPushDedupRepository;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.wallet.dto.WalletResponse;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SyncService {

    private static final Set<String> SUPPORTED_ENTITIES = Set.of("wallets", "categories", "transactions", "budgets");

    private final SyncChangeLogRepository syncChangeLogRepository;
    private final SyncPushDedupRepository syncPushDedupRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    public SyncPullResponse pull(UUID userId, Long cursor, Integer limit) {
        long safeCursor = (cursor == null || cursor < 0) ? 0L : cursor;
        int safeLimit = limit == null ? 500 : Math.max(1, Math.min(limit, 1000));

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
        Set<UUID> categoryUpserts = new LinkedHashSet<>();
        Set<UUID> transactionUpserts = new LinkedHashSet<>();

        Set<UUID> walletDeletes = new LinkedHashSet<>();
        Set<UUID> categoryDeletes = new LinkedHashSet<>();
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
                case "categories" -> {
                    if (isDelete) categoryDeletes.add(id);
                    else categoryUpserts.add(id);
                }
                case "transactions" -> {
                    if (isDelete) transactionDeletes.add(id);
                    else transactionUpserts.add(id);
                }
                case "budgets" -> {
                    if (isDelete) budgetDeletes.add(id);
                }
                default -> {
                }
            }
        }

        List<WalletResponse> walletChanges = walletUpserts.isEmpty()
            ? List.of()
            : walletRepository.findByUserIdAndWalletIdInAndDeletedAtIsNull(userId, walletUpserts)
            .stream()
            .map(WalletResponse::from)
            .toList();

        List<CategoryResponse> categoryChanges = categoryUpserts.isEmpty()
                ? List.of()
                : categoryRepository.findByUserIdAndCategoryIdInAndDeletedAtIsNull(userId, categoryUpserts)
                .stream()
                .map(this::toCategoryResponse)
                .toList();

        List<TransactionResponse> transactionChanges = transactionUpserts.isEmpty()
                ? List.of()
                : transactionRepository.findByCreatedByAndTransactionIdInAndDeletedAtIsNull(userId, transactionUpserts)
                .stream()
                .map(this::toTransactionResponse)
                .toList();

        Map<String, List<?>> changes = new LinkedHashMap<>();
        changes.put("wallets", walletChanges);
        changes.put("categories", categoryChanges);
        changes.put("budgets", List.of());
        changes.put("transactions", transactionChanges);

        Map<String, List<UUID>> deletes = new LinkedHashMap<>();
        deletes.put("wallets", List.copyOf(walletDeletes));
        deletes.put("categories", List.copyOf(categoryDeletes));
        deletes.put("budgets", List.copyOf(budgetDeletes));
        deletes.put("transactions", List.copyOf(transactionDeletes));

        return SyncPullResponse.builder()
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .changes(changes)
                .deletes(deletes)
                .build();
    }

    private CategoryResponse toCategoryResponse(Category c) {
        return CategoryResponse.builder()
                .categoryId(c.getCategoryId())
                .name(c.getName())
                .icon(c.getIcon())
                .color(c.getColor())
                .type(c.getType())
                .build();
    }

    private TransactionResponse toTransactionResponse(Transaction tx) {
        return new TransactionResponse(
            tx.getTransactionId(),
            tx.getWalletId(),
            tx.getCategory().getCategoryId(),
            tx.getAmount(),
            tx.getNote(),
            tx.getDate(),
            tx.getCreatedAt(),
            tx.getUpdatedAt()
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
            case "categories":
                return processCategoryOperation(userId, op);
            case "transactions":
                return processTransactionOperation(userId, op);
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
            if (op.getBaseVersion() != null && !op.getBaseVersion().equals(existing.getVersion())) {
                return buildConflictResult(op, existing.getVersion(), walletToMap(existing));
            }
        }

        if ("DELETE".equalsIgnoreCase(op.getOp())) {
            if (existingOpt.isEmpty()) {
                return buildOkResult(op, null);
            }
            Wallet wallet = existingOpt.get();
            wallet.setDeletedAt(Instant.now());
            walletRepository.save(wallet);
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
            wallet.setCurrentBalance(data.getCurrentBalance() != null ? data.getCurrentBalance() : java.math.BigDecimal.ZERO);
            wallet.setDescription(data.getDescription());
            if (data.getDeletedAt() != null) {
                wallet.setDeletedAt(Instant.ofEpochMilli(data.getDeletedAt()));
            }
            walletRepository.save(wallet);
            return buildOkResult(op, wallet.getVersion());
        }
    }

    @Transactional
    protected SyncOperationResult processCategoryOperation(UUID userId, SyncOperation op) {
        UUID entityId = UUID.fromString(op.getEntityId());
        Optional<Category> existingOpt = categoryRepository.findById(entityId);

        // Check conflict
        if (existingOpt.isPresent()) {
            Category existing = existingOpt.get();
            if (existing.getUserId() != null && !existing.getUserId().equals(userId)) {
                return buildErrorResult(op, "Access denied: not your category");
            }
            if (op.getBaseVersion() != null && !op.getBaseVersion().equals(existing.getVersion())) {
                return buildConflictResult(op, existing.getVersion(), categoryToMap(existing));
            }
        }

        if ("DELETE".equalsIgnoreCase(op.getOp())) {
            if (existingOpt.isEmpty()) {
                return buildOkResult(op, null);
            }
            Category category = existingOpt.get();
            category.setDeletedAt(Instant.now());
            categoryRepository.save(category);
            return buildOkResult(op, category.getVersion());
        } else {
            // UPSERT
            CategoryPushData data = objectMapper.convertValue(op.getData(), CategoryPushData.class);
            Category category = existingOpt.orElse(new Category());
            category.setCategoryId(entityId);
            category.setUserId(userId);
            category.setName(data.getName());
            category.setType(data.getType());
            category.setIcon(data.getIcon());
            category.setColor(data.getColor());
            category.setIsDefault(data.getIsDefault() != null ? data.getIsDefault() : false);
            category.setIsHidden(data.getIsHidden() != null ? data.getIsHidden() : false);
            if (data.getDeletedAt() != null) {
                category.setDeletedAt(Instant.ofEpochMilli(data.getDeletedAt()));
            }
            categoryRepository.save(category);
            return buildOkResult(op, category.getVersion());
        }
    }

    @Transactional
    protected SyncOperationResult processTransactionOperation(UUID userId, SyncOperation op) {
        UUID entityId = UUID.fromString(op.getEntityId());
        Optional<Transaction> existingOpt = transactionRepository.findById(entityId);

        // Check conflict
        if (existingOpt.isPresent()) {
            Transaction existing = existingOpt.get();
            if (!existing.getCreatedBy().equals(userId)) {
                return buildErrorResult(op, "Access denied: not your transaction");
            }
            if (op.getBaseVersion() != null && !op.getBaseVersion().equals(existing.getVersion())) {
                return buildConflictResult(op, existing.getVersion(), transactionToMap(existing));
            }
        }

        if ("DELETE".equalsIgnoreCase(op.getOp())) {
            if (existingOpt.isEmpty()) {
                return buildOkResult(op, null);
            }
            Transaction tx = existingOpt.get();
            tx.setDeletedAt(Instant.now());
            transactionRepository.save(tx);
            return buildOkResult(op, tx.getVersion());
        } else {
            // UPSERT
            TransactionPushData data = objectMapper.convertValue(op.getData(), TransactionPushData.class);
            Transaction tx = existingOpt.orElse(new Transaction());

            // Get category
            UUID categoryId = UUID.fromString(data.getCategoryId());
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));

            tx.setTransactionId(entityId);
            tx.setWalletId(UUID.fromString(data.getWalletId()));
            tx.setCreatedBy(userId);
            tx.setCategory(category);
            tx.setAmount(data.getAmount());
            tx.setNote(data.getNote());
            tx.setDate(data.getTxDate() != null ? LocalDate.parse(data.getTxDate()) : LocalDate.now());
            if (data.getDeletedAt() != null) {
                tx.setDeletedAt(Instant.ofEpochMilli(data.getDeletedAt()));
            }
            transactionRepository.save(tx);
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
        map.put("currentBalance", wallet.getCurrentBalance());
        map.put("description", wallet.getDescription());
        map.put("version", wallet.getVersion());
        map.put("createdAt", wallet.getCreatedAt().toEpochMilli());
        map.put("updatedAt", wallet.getUpdatedAt().toEpochMilli());
        map.put("deletedAt", wallet.getDeletedAt() != null ? wallet.getDeletedAt().toEpochMilli() : null);
        return map;
    }

    private Map<String, Object> categoryToMap(Category cat) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("categoryId", cat.getCategoryId().toString());
        map.put("name", cat.getName());
        map.put("type", cat.getType());
        map.put("icon", cat.getIcon());
        map.put("color", cat.getColor());
        map.put("isDefault", cat.getIsDefault());
        map.put("isHidden", cat.getIsHidden());
        map.put("version", cat.getVersion());
        map.put("createdAt", cat.getCreatedAt().toEpochMilli());
        map.put("updatedAt", cat.getUpdatedAt().toEpochMilli());
        map.put("deletedAt", cat.getDeletedAt() != null ? cat.getDeletedAt().toEpochMilli() : null);
        return map;
    }

    private Map<String, Object> transactionToMap(Transaction tx) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("transactionId", tx.getTransactionId().toString());
        map.put("walletId", tx.getWalletId().toString());
        map.put("categoryId", tx.getCategory().getCategoryId().toString());
        map.put("amount", tx.getAmount());
        map.put("note", tx.getNote());
        map.put("txDate", tx.getDate().toString());
        map.put("version", tx.getVersion());
        map.put("createdAt", tx.getCreatedAt().toEpochMilli());
        map.put("updatedAt", tx.getUpdatedAt().toEpochMilli());
        map.put("deletedAt", tx.getDeletedAt() != null ? tx.getDeletedAt().toEpochMilli() : null);
        return map;
    }
}
