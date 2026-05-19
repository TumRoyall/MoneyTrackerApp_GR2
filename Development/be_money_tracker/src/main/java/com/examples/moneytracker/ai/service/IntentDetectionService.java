package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.IntentResult;

public interface IntentDetectionService {
    IntentResult detectIntent(String text);
}
