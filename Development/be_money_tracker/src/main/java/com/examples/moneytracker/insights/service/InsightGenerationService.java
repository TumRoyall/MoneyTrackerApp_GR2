package com.examples.moneytracker.insights.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.insights.dto.InsightResponse;

import java.util.List;

public interface InsightGenerationService {
    List<InsightResponse> generate(List<BehaviorSignalDto> signals);
}
