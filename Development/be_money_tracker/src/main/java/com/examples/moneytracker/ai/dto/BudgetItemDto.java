package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetItemDto {
    private UUID categoryId;
    private String categoryName;
    private Integer percent;
    private BigDecimal amount;
    private String aiReasoning;
}
