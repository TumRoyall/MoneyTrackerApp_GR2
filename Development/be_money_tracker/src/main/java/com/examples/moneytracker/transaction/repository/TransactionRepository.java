package com.examples.moneytracker.transaction.repository;

import com.examples.moneytracker.transaction.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByAccountIdAndDateBetweenOrderByDateDesc(Long accountId, LocalDate from, LocalDate to);

    Optional<Transaction> findByTransactionIdAndCreatedBy(Long id, Long createdBy);
}
