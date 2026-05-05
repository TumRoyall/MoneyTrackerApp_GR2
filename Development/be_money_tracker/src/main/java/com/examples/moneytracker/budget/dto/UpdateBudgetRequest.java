package com.examples.moneytracker.budget.dto;

import com.examples.moneytracker.budget.model.BudgetPeriodType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class UpdateBudgetRequest {
    private UUID walletId;
    private UUID categoryId;
    private List<UUID> categoryIds;
    private BigDecimal amountLimit;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BudgetPeriodType periodType;
    private BigDecimal alertThreshold;
}
