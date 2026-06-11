package com.examples.moneytracker.event.repository;

import com.examples.moneytracker.event.model.EventTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventTransactionRepository extends JpaRepository<EventTransaction, UUID> {

    /**
     * Find transaction by ID (not deleted)
     */
    Optional<EventTransaction> findByIdAndDeletedAtIsNull(UUID id);

    /**
     * Find transaction by ID and event
     */
    Optional<EventTransaction> findByIdAndEventIdAndDeletedAtIsNull(UUID id, UUID eventId);

    /**
     * Get all transactions for an event
     */
    List<EventTransaction> findByEventIdAndDeletedAtIsNullOrderByDateDescCreatedAtDesc(UUID eventId);

    /**
     * Get paginated transactions for an event
     */
    Page<EventTransaction> findByEventIdAndDeletedAtIsNullOrderByDateDescCreatedAtDesc(UUID eventId, Pageable pageable);

    /**
     * Get transactions by creator
     */
    List<EventTransaction> findByEventIdAndCreatorIdAndDeletedAtIsNullOrderByDateDesc(UUID eventId, UUID creatorId);

    /**
     * Count transactions in an event
     */
    long countByEventIdAndDeletedAtIsNull(UUID eventId);

    /**
     * Sum of all amounts in event
     */
    @Query("SELECT COALESCE(SUM(et.amount), 0) FROM EventTransaction et WHERE et.eventId = :eventId AND et.deletedAt IS NULL")
    BigDecimal sumAmountByEventId(@Param("eventId") UUID eventId);

    /**
     * Get total amount by payer
     */
    @Query("""
        SELECT et.payerId, SUM(et.amount) as total
        FROM EventTransaction et
        WHERE et.eventId = :eventId AND et.deletedAt IS NULL
        GROUP BY et.payerId
    """)
    List<Object[]> sumAmountByPayer(@Param("eventId") UUID eventId);

    /**
     * Get transactions by payer
     */
    List<EventTransaction> findByEventIdAndPayerIdAndDeletedAtIsNull(UUID eventId, UUID payerId);

    /**
     * Get transactions by date range
     */
    @Query("""
        SELECT et FROM EventTransaction et
        WHERE et.eventId = :eventId
        AND et.date BETWEEN :startDate AND :endDate
        AND et.deletedAt IS NULL
        ORDER BY et.date DESC
    """)
    List<EventTransaction> findByEventIdAndDateRange(
            @Param("eventId") UUID eventId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Check if user has any transactions in event
     */
    @Query("""
        SELECT CASE WHEN COUNT(et) > 0 THEN true ELSE false END
        FROM EventTransaction et
        WHERE et.eventId = :eventId
        AND (et.creatorId = :userId OR et.payerId = :userId)
        AND et.deletedAt IS NULL
    """)
    boolean hasUserTransactionsInEvent(@Param("eventId") UUID eventId, @Param("userId") UUID userId);
}