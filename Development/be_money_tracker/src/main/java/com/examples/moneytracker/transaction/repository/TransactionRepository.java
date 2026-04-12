package com.examples.moneytracker.transaction.repository;

import com.examples.moneytracker.transaction.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByWalletIdAndDateBetweenOrderByDateDesc(UUID walletId, LocalDate from, LocalDate to);

    Optional<Transaction> findByTransactionIdAndCreatedBy(UUID id, UUID createdBy);

    List<Transaction> findByCreatedByAndTransactionIdInAndDeletedAtIsNull(UUID createdBy, Collection<UUID> transactionIds);
}
