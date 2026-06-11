package com.examples.moneytracker.event.repository;

import com.examples.moneytracker.event.model.Event;
import com.examples.moneytracker.event.model.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    /**
     * Find event by share code
     */
    Optional<Event> findByShareCodeAndDeletedAtIsNull(String shareCode);

    /**
     * Find event by ID (not deleted)
     */
    Optional<Event> findByEventIdAndDeletedAtIsNull(UUID eventId);

    /**
     * Check if share code exists
     */
    boolean existsByShareCode(String shareCode);

    /**
     * Find all events created by user
     */
    @Query("SELECT e FROM Event e WHERE e.createdBy = :userId AND e.deletedAt IS NULL ORDER BY e.createdAt DESC")
    List<Event> findByCreatedByAndDeletedAtIsNull(@Param("userId") UUID userId);

    /**
     * Find all active events for user (as creator or member)
     */
    @Query("""
        SELECT DISTINCT e FROM Event e
        LEFT JOIN EventMember em ON em.eventId = e.eventId AND em.userId = :userId AND em.deletedAt IS NULL
        WHERE (e.createdBy = :userId OR em.userId = :userId)
        AND e.deletedAt IS NULL
        AND e.status = :status
        ORDER BY e.createdAt DESC
    """)
    List<Event> findByUserAndStatus(@Param("userId") UUID userId, @Param("status") EventStatus status);

    /**
     * Find all events for user
     */
    @Query("""
        SELECT DISTINCT e FROM Event e
        LEFT JOIN EventMember em ON em.eventId = e.eventId AND em.userId = :userId AND em.deletedAt IS NULL
        WHERE (e.createdBy = :userId OR em.userId = :userId)
        AND e.deletedAt IS NULL
        ORDER BY e.createdAt DESC
    """)
    List<Event> findAllByUser(@Param("userId") UUID userId);
}