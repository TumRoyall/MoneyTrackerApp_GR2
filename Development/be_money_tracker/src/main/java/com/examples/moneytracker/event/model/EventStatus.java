package com.examples.moneytracker.event.model;

/**
 * Event status enum
 */
public enum EventStatus {
    /**
     * Event is active, can add transactions
     */
    ACTIVE,

    /**
     * Event has been settled, read-only
     */
    SETTLED,

    /**
     * Event has been archived by owner, read-only
     */
    ARCHIVED
}