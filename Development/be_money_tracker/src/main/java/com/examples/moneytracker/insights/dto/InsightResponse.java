package com.examples.moneytracker.insights.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InsightResponse {
    private String type;
    private String severity;
    private String message;
}
