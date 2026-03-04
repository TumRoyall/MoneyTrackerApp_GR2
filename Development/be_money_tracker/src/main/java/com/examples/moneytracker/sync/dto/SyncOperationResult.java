package com.examples.moneytracker.sync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncOperationResult {
    private Integer outboxId;
    private String requestId;
    private String status; // ok, conflict, error
    private Long newVersion;
    private Long serverVersion;
    private Map<String, Object> serverData;
    private String error;
}
