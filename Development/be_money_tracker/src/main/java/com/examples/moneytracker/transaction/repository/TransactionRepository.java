package com.examples.moneytracker.transaction.repository;

import com.examples.moneytracker.transaction.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByWalletIdAndDateBetweenOrderByDateDesc(UUID walletId, LocalDate from, LocalDate to);

    Optional<Transaction> findByTransactionIdAndCreatedByAndDeletedAtIsNull(UUID id, UUID createdBy);

    List<Transaction> findByCreatedByAndTransactionIdInAndDeletedAtIsNull(UUID createdBy, Collection<UUID> transactionIds);

    List<Transaction> findByCreatedByAndDeletedAtIsNull(UUID createdBy);

    @Query("SELECT DISTINCT t.date FROM Transaction t WHERE t.createdBy = :userId AND t.date BETWEEN :from AND :to AND t.deletedAt IS NULL")
    List<LocalDate> findDistinctDatesByUserIdAndDateBetween(@Param("userId") UUID userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.type = com.examples.moneytracker.transaction.model.TransactionType.INCOME THEN t.amount ELSE -t.amount END), 0) " +
           "FROM Transaction t WHERE t.walletId = :walletId AND t.deletedAt IS NULL")
    java.math.BigDecimal sumSignedAmountByWalletId(@Param("walletId") UUID walletId);

    List<Transaction> findByCreatedByAndDeletedAtIsNotNull(UUID createdBy);
}

