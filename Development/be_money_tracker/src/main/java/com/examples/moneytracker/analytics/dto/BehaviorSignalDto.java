package com.examples.moneytracker.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BehaviorSignalDto {
    private String type;
    private String severity;
    private LocalDate windowStart;
    private LocalDate windowEnd;
    private String evidence;
}
