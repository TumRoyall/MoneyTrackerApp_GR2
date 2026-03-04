package com.examples.moneytracker.sync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncPullResponse {
    private Long nextCursor;
    private boolean hasMore;
    private Map<String, List<?>> changes;
    private Map<String, List<UUID>> deletes;
}
