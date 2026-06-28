package com.examples.moneytracker.event.repository;

import com.examples.moneytracker.event.model.EventMember;
import com.examples.moneytracker.event.model.EventMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventMemberRepository extends JpaRepository<EventMember, UUID> {

    /**
     * Find member by event and user
     */
    Optional<EventMember> findByEventIdAndUserIdAndDeletedAtIsNull(UUID eventId, UUID userId);


    /**
     * Check if user is member of event
     */
    boolean existsByEventIdAndUserIdAndDeletedAtIsNull(UUID eventId, UUID userId);

    /**
     * Get all active members of an event
     */
    List<EventMember> findByEventIdAndDeletedAtIsNullOrderByJoinedAtAsc(UUID eventId);

    /**
     * Count members in an event
     */
    long countByEventIdAndDeletedAtIsNull(UUID eventId);

    /**
     * Check if user is owner of event
     */
    @Query("""
        SELECT CASE WHEN COUNT(em) > 0 THEN true ELSE false END
        FROM EventMember em
        WHERE em.eventId = :eventId
        AND em.userId = :userId
        AND em.role = :role
        AND em.deletedAt IS NULL
    """)
    boolean isUserRoleInEvent(@Param("eventId") UUID eventId, @Param("userId") UUID userId, @Param("role") EventMemberRole role);

    /**
     * Get owner of event
     */
    @Query("""
        SELECT em FROM EventMember em
        WHERE em.eventId = :eventId
        AND em.role = 'OWNER'
        AND em.deletedAt IS NULL
    """)
    Optional<EventMember> findOwnerByEventId(@Param("eventId") UUID eventId);

    /**
     * Get all events for a user
     */
    @Query("SELECT em.eventId FROM EventMember em WHERE em.userId = :userId AND em.deletedAt IS NULL")
    List<UUID> findEventIdsByUserId(@Param("userId") UUID userId);
}