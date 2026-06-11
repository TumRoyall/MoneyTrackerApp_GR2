package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class TopCategory {
    private UUID categoryId;
    private String name;
    private BigDecimal totalExpense;
}
