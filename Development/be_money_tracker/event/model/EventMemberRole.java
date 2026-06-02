package com.examples.moneytracker.event.model;

/**
 * Event member role enum
 */
public enum EventMemberRole {
    /**
     * Event creator, has full control
     */
    OWNER,

    /**
     * Regular member, can only CRUD own transactions
     */
    MEMBER
}