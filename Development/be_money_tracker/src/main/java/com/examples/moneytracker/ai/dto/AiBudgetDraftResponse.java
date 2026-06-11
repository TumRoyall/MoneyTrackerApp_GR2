package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiBudgetDraftResponse {
    private UUID draftId;
    private List<BudgetItemDto> items;
    private BudgetSummaryDto summary;
}
