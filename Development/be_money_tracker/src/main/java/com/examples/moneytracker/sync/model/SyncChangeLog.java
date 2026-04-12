package com.examples.moneytracker.sync.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sync_change_log")
@Getter
@Setter
public class SyncChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cursor_id")
    private Long cursorId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 50)
    private String entity;

    @Column(nullable = false)
    private UUID entityPk;

    @Column(nullable = false, length = 10)
    private String op;

    @Column(nullable = false)
    private Instant changedAt;
}
