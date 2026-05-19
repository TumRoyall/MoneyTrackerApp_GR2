package com.examples.moneytracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class CategorySpendDto {
    private UUID categoryId;
    private String categoryName;
    private BigDecimal amount;
}
