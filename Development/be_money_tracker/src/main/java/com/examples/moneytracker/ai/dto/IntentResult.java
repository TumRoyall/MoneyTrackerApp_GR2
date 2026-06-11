package com.examples.moneytracker.ai.dto;

import com.examples.moneytracker.ai.enums.IntentType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class IntentResult {
    private IntentType intent;
    private double confidence;
    private Map<String, Object> entities;
}
