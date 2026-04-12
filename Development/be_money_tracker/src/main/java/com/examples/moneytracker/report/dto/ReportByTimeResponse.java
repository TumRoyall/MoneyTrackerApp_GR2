package com.examples.moneytracker.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ReportByTimeResponse {
    private List<TimeSeriesPoint> series;
    private String trend;
    private String peakPeriod;
}
