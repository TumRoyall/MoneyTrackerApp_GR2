package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Maps to FE type: GardenMonthlyReport.
 * Returned by GET /api/garden/month-report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenMonthReportResponse {
    private String month;
    private int year;
    private GardenSeedResponse seed;
    private GardenScoreResponse finalScore;
    private double savingsRate;
    private double spendingChange;
    private List<String> achievements;
    private List<ReplayEntry> replay;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplayEntry {
        private String stage;
        private String quality;
        private int day;
    }
}
