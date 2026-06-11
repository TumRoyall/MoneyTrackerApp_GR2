package com.examples.moneytracker.analytics.service;

import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;

import java.time.LocalDate;
import java.util.UUID;

public interface AnalyticsService {
    AnalyticsSummaryDto monthlySummary(UUID userId, LocalDate now);
}
