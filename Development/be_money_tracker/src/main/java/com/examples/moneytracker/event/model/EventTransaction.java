package com.examples.moneytracker.event.model;

import com.examples.moneytracker.category.model.Category;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * EventTransaction - Transaction for event expenses
 */
@Entity
@Table(name = "event_transactions")
@Data
public class EventTransaction {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Event this transaction belongs to
     */
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /**
     * User who created this transaction
     */
    @Column(name = "created_by", nullable = false)
    private UUID creatorId;

    /**
     * User who actually paid for this expense
     * (can be different from creator)
     */
    @Column(name = "payer_id", nullable = false)
    private UUID payerId;

    /**
     * Transaction amount
     */
    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    /**
     * Category for this transaction
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * Transaction note/description
     */
    @Column(columnDefinition = "TEXT")
    private String note;

    /**
     * Transaction date
     */
    @Column(name = "tx_date", nullable = false)
    private LocalDate date;

    /**
     * Was money transferred from personal wallet?
     */
    @Column(name = "is_transfer_from_personal")
    private Boolean isTransferFromPersonal;

    /**
     * Source wallet if isTransferFromPersonal = true
     */
    @Column(name = "personal_wallet_id")
    private UUID personalWalletId;

    /**
     * Timestamp when transaction was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Timestamp when transaction was last updated
     */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Timestamp when transaction was deleted (soft delete)
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Version for optimistic locking
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isTransferFromPersonal == null) {
            this.isTransferFromPersonal = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Check if this transaction was transferred from personal wallet
     */
    public boolean hasTransfer() {
        return Boolean.TRUE.equals(this.isTransferFromPersonal);
    }
}