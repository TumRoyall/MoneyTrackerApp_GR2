package com.examples.moneytracker.insights.service;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.insights.dto.InsightResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SimpleInsightGenerationService implements InsightGenerationService {

    @Override
    public List<InsightResponse> generate(List<BehaviorSignalDto> signals) {
        List<InsightResponse> insights = new ArrayList<>();
        for (BehaviorSignalDto signal : signals) {
            if ("WEEKEND_SPIKE".equals(signal.getType())) {
                insights.add(new InsightResponse(
                        signal.getType(),
                        signal.getSeverity(),
                        "You spend more on weekends than weekdays."
                ));
            }
        }
        return insights;
    }
}
