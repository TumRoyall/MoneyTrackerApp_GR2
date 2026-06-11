package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ReportSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal net;
    private long transactionCount;
    private TopCategory topCategory;
    private TopWallet topWallet;
}
